using OutageMap.Server.Hubs;
using OutageMap.Server.Startup;

var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    ContentRootPath = AppContext.BaseDirectory,
    WebRootPath = "wwwroot"
});

var feed = builder.Configuration.GetOutageFeed();

builder.Services
    .AddOutageApi()
    .AddOutagePersistence(builder.Configuration, builder.Environment)
    .AddOutageFeed(builder.Configuration, feed)
    .AddOutageThrottling(feed.PollInterval)
    .AddStaticAssetCaching();

builder.Services.AddHealthChecks();

var app = builder.Build();

app.UseExceptionHandler();
app.UseSecurityHeaders();
app.UseHttpsRedirection();

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseSwaggerInDevelopment();

app.UseRateLimiter();
app.UseOutputCache();

app.MapControllers();
app.MapHub<OutageHub>("/outageHub");
app.MapHealthChecks("/healthz");
app.MapFallbackToFile("/index.html");

app.Run();
