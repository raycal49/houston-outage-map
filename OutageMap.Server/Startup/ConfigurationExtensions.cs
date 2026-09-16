using OutageMap.Server.Infrastructure.Http;

namespace OutageMap.Server.Startup;

public static class ConfigurationExtensions
{
    public static OutageFeedOptions GetOutageFeed(this IConfiguration configuration) =>
        configuration.GetSection(OutageFeedOptions.SectionName).Get<OutageFeedOptions>()
            ?? throw new InvalidOperationException(
                $"Configuration section '{OutageFeedOptions.SectionName}' is not configured.");
}
