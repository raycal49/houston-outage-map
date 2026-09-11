// DemoSource.cs

using OutageMap.Server.Dtos;
using System.Text.Json;

namespace OutageMap.Server.Infrastructure.Http;

public class DemoSource : IOutageSource
{
    private readonly string _outagePath;
    private readonly string _locationsPath;
    private readonly Random _random = new();
    private readonly DateTimeOffset _demoStartedAt = DateTimeOffset.UtcNow;

    private List<OutageDto>? _outages;
    private int _poll;

    public DemoSource(IWebHostEnvironment env)
    {
        _outagePath = Path.Combine(env.ContentRootPath, "Demo", "outages.json");
        _locationsPath = Path.Combine(env.ContentRootPath, "Demo", "locations.json");
    }

    public async Task<List<OutageDto>> GetOutageData()
    {
        _outages ??= await LoadDemoOutages();

        _poll++;

        if (_poll % 2 == 0)
        {
            _outages[0].NumPeople -= 30;
            _outages[1].NumPeople -= 20;
            _outages[2].NumPeople -= 15;

            _outages[3].Status = "Crew Assessing";
            _outages[4].Status = "Planned Outage";
            _outages[5].Status = "Further Assessment Needed";
        }
        else
        {
            _outages[0].NumPeople += 30;
            _outages[1].NumPeople += 20;
            _outages[2].NumPeople += 15;

            _outages[3].Status = "Pending Assessment";
            _outages[4].Status = "Crew Assessing";
            _outages[5].Status = "Planned Outage";
        }

        var outages = new List<OutageDto>(_outages);

        if (_random.Next(3) == 0)
            outages.Add(await CreateDemoOutage());

        return outages;
    }

    private async Task<List<OutageDto>> LoadDemoOutages()
    {
        await using var stream = File.OpenRead(_outagePath);

        var outages = await JsonSerializer.DeserializeAsync<List<OutageDto>>(stream) ?? [];

        foreach (var outage in outages)
        {
            outage.StartTime = _demoStartedAt.AddMinutes(-10).ToUnixTimeMilliseconds();
            outage.EtrTime = _demoStartedAt.AddMinutes(_random.Next(30, 121)).ToUnixTimeMilliseconds();
        }

        return outages;
    }

    private async Task<OutageDto> CreateDemoOutage()
    {
        await using var stream = File.OpenRead(_locationsPath);

        var locationTemplates = await JsonSerializer.DeserializeAsync<List<OutageDto>>(stream) ?? [];
        var locationTemplate = locationTemplates[_random.Next(locationTemplates.Count)];

        return new OutageDto
        {
            Id = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            Identifier = _random.Next(6_000_000, 7_000_000).ToString(),

            Latitude = locationTemplate.Latitude,
            Longitude = locationTemplate.Longitude,

            StartTime = DateTimeOffset.UtcNow.AddMinutes(-10).ToUnixTimeMilliseconds(),
            LastUpdatedTime = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            EtrTime = DateTimeOffset.UtcNow.AddMinutes(_random.Next(30, 121)).ToUnixTimeMilliseconds(),

            NumPeople = _random.Next(5, 50),
            Status = "Pending Assessment",

            AdditionalProperties = locationTemplate.AdditionalProperties
        };
    }
}