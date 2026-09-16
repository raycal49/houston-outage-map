using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using NetTopologySuite.IO.Converters;
using OutageMap.Server.Demo;
using OutageMap.Server.Infrastructure.Http;
using OutageMap.Server.Models;
using OutageMap.Server.Services;
using OutageMap.Server.Services.BackgroundServices;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;

namespace OutageMap.Server.Startup;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddOutageApi(this IServiceCollection services)
    {
        services.AddControllers().AddJsonOptions(o =>
        {
            o.JsonSerializerOptions.Converters.Add(new GeoJsonConverterFactory());
            o.JsonSerializerOptions.NumberHandling = JsonNumberHandling.AllowNamedFloatingPointLiterals;
            o.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        });

        services.AddProblemDetails();
        services.AddSignalR();

        services.AddSwaggerGen(c =>
            c.CustomSchemaIds(type => type.FullName!
                .Replace("+", ".")
                .Replace("`", "_")));

        return services;
    }

    public static IServiceCollection AddOutagePersistence(this IServiceCollection services,IConfiguration configuration, IHostEnvironment environment)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not configured.");

        services.AddDbContext<AppDbContext>(options =>
        {
            options.UseSqlServer(connectionString, sql =>
            {
                sql.UseNetTopologySuite();
                sql.EnableRetryOnFailure();
            });

            if (environment.IsDevelopment())
            {
                options.EnableDetailedErrors();
                options.EnableSensitiveDataLogging();
            }
        });

        services.AddScoped<IOutageReader, OutageReader>();

        return services;
    }

    public static IServiceCollection AddOutageFeed(this IServiceCollection services, IConfiguration configuration, OutageFeedOptions feed)
    {
        services.AddOptions<OutageFeedOptions>()
            .Bind(configuration.GetSection(OutageFeedOptions.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        if (string.Equals(feed.Source, "Live", StringComparison.OrdinalIgnoreCase))
        {
            services.AddHttpClient<IOutageSource, PollOutageSource>((provider, client) =>
            {
                var options = provider.GetRequiredService<IOptions<OutageFeedOptions>>().Value;
                client.BaseAddress = options.Url;
            });
        }
        else
        {
            services.AddSingleton<IOutageSource, DemoSource>();
        }

        services.AddSingleton<OutageSimulator>();
        services.AddScoped<OutageSyncService>();
        services.AddHostedService<OutagePoller>();

        return services;
    }

    public static IServiceCollection AddOutageThrottling( this IServiceCollection services, TimeSpan cacheLifetime)
    {
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            options.AddPolicy(OutagePolicies.RateLimit, httpContext =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 50,
                        Window = TimeSpan.FromMinutes(3),
                        QueueLimit = 0,
                    }));
        });

        services.AddOutputCache(options =>
            options.AddPolicy(OutagePolicies.OutputCache, policy => policy
                .Expire(cacheLifetime)
                .Tag(OutagePolicies.OutagesTag)
                .SetVaryByQuery([])));

        return services;
    }

    public static IServiceCollection AddStaticAssetCaching(this IServiceCollection services) =>
        services.Configure<StaticFileOptions>(options =>
            options.OnPrepareResponse = context =>
                context.Context.Response.Headers.CacheControl =
                    context.Context.Request.Path.StartsWithSegments(OutagePolicies.HashedAssetPath)
                        ? "public,max-age=31536000,immutable"
                        : "no-cache");
}
