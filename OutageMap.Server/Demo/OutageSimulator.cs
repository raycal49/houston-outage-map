using OutageMap.Server.Dtos;
using System.Text.Json;

namespace OutageMap.Server.Demo;

public class OutageSimulator
{
    private int _pollCount;

    private readonly Random _random = new();
    private readonly List<OutageDto> _outages;
    private long _nextOutageId = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

    public OutageSimulator()
    {
        _outages = LoadDemoOutages();
    }

    public List<OutageDto> GetSimulatedOutages()
    {
        AdvanceDemoState();
        SimulateResolvedOutages();

        if (_random.Next(3) == 0)
            _outages.Add(CreateDemoOutage());

        return _outages;
    }

    private void AdvanceDemoState()
    {
        _pollCount++;

        if (_pollCount % 2 != 0)
            return;

        foreach (OutageDto outage in _outages)
        {
            string? previousStatus = outage.Status;
            int previousNumPeople = outage.NumPeople;

            outage.Status = SimulateStatusChange(outage.Status);
            SimulateAffectedCustomers(outage);

            if (outage.Status != previousStatus || outage.NumPeople != previousNumPeople)
                outage.LastUpdatedTime = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        }
    }

    private string? SimulateStatusChange(string? currentStatus)
    {
        switch (currentStatus)
        {
            case "Pending Assessment":
                return GetRandomStatus("Crew Assessing", "Planned Outage", "Further Assessment Needed");

            case "Crew Assessing":
                return GetRandomStatus("Pending Assessment", "Further Assessment Needed");

            case "Further Assessment Needed":
                return GetRandomStatus("Pending Assessment", "Crew Assessing");

            default:
                return currentStatus;
        }
    }

    private string GetRandomStatus(params string[] statuses)
    {
        return statuses[_random.Next(statuses.Length)];
    }

    private void SimulateAffectedCustomers(OutageDto outage)
    {
        int change = _random.Next(-10, 11);
        outage.NumPeople = Math.Max(1, outage.NumPeople + change);
    }

    private void SimulateResolvedOutages()
    {
        long now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        _outages.RemoveAll(outage => outage.EtrTime != null && outage.EtrTime <= now);
    }

    private List<OutageDto> LoadDemoOutages()
    {
        var outages = new List<OutageDto>();

        for (int i = 0; i < 6; i++)
            outages.Add(CreateDemoOutage());

        return outages;
    }

    private OutageDto CreateDemoOutage()
    {
        DemoLocation location = DemoLocations.GetRandom(_random);
        DateTimeOffset now = DateTimeOffset.UtcNow;

        return new OutageDto
        {
            Id = _nextOutageId++,
            Identifier = _random.Next(6_000_000, 7_000_000).ToString(),
            Latitude = location.Latitude,
            Longitude = location.Longitude,
            StartTime = now.AddMinutes(-10).ToUnixTimeMilliseconds(),
            LastUpdatedTime = now.ToUnixTimeMilliseconds(),
            EtrTime = now.AddMinutes(_random.Next(30, 121)).ToUnixTimeMilliseconds(),
            NumPeople = _random.Next(5, 50),
            Status = GetRandomStatus("Pending Assessment", "Crew Assessing", "Planned Outage", "Further Assessment Needed"),

            AdditionalProperties =
            [
                CreateProperty("AREA_CITY", location.City),
                CreateProperty("AREA_COUNTY", location.County),
                CreateProperty("AREA_SERVICE", location.ServiceArea),
                CreateProperty("AREA_ZIP", location.ZipCode)
            ]
        };
    }

    private double GetCoordinateOffset()
    {
        int offsetAmount = _random.Next(1, 6);
        double offset = offsetAmount / 1000.0;

        if (_random.Next(2) == 0)
            offset = -1 * offset;

        return offset;
    }

    private static OutageProperties CreateProperty(string property, string value)
    {
        return new OutageProperties
        {
            Property = property,
            Value = JsonSerializer.SerializeToElement(new[] { value })
        };
    }
}
