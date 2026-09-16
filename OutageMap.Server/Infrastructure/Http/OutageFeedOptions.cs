using System.ComponentModel.DataAnnotations;

namespace OutageMap.Server.Infrastructure.Http;

public sealed class OutageFeedOptions
{
    public const string SectionName = "OutageFeed";

    /// <summary>"Live" selects the upstream HTTP feed; anything else uses the demo source.</summary>
    public string? Source { get; init; }

    [Required]
    public required Uri Url { get; init; }

    public TimeSpan PollInterval { get; init; } = TimeSpan.FromMinutes(10);
}