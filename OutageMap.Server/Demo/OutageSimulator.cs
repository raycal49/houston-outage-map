using OutageMap.Server.Dtos;
using System.Text.Json;

namespace OutageMap.Server.Demo;

public class OutageSimulator
{
    private const int PlannedOutagePercent = 12;

    private int _pollCount;

    private readonly Random _random = new();
    private readonly List<OutageDto> _outages;
    private readonly HashSet<(double Latitude, double Longitude)> _usedCoordinates = [];
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
                return GetRandomStatus("Crew Assessing", "Further Assessment Needed");

            case "Crew Assessing":
                return GetRandomStatus("Pending Assessment", "Further Assessment Needed");

            case "Further Assessment Needed":
                return GetRandomStatus("Pending Assessment", "Crew Assessing");

            default:
                return currentStatus;
        }
    }

    private string GetInitialStatus()
    {
        bool isScheduledMaintenance = _random.Next(100) < PlannedOutagePercent;

        if (isScheduledMaintenance)
            return "Planned Outage";

        return GetRandomStatus("Pending Assessment", "Crew Assessing", "Further Assessment Needed");
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

        _outages.RemoveAll(outage =>
        {
            if (outage.EtrTime == null || outage.EtrTime > now)
                return false;

            _usedCoordinates.Remove((outage.Latitude, outage.Longitude));

            return true;
        });
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
        (double latitude, double longitude) = GetUniqueCoordinate(location);
        DateTimeOffset now = DateTimeOffset.UtcNow;

        return new OutageDto
        {
            Id = _nextOutageId++,
            Identifier = _random.Next(6_000_000, 7_000_000).ToString(),
            Latitude = latitude,
            Longitude = longitude,
            StartTime = now.AddMinutes(-10).ToUnixTimeMilliseconds(),
            LastUpdatedTime = now.ToUnixTimeMilliseconds(),
            EtrTime = now.AddMinutes(_random.Next(30, 121)).ToUnixTimeMilliseconds(),
            NumPeople = _random.Next(5, 50),
            Status = GetInitialStatus(),

            AdditionalProperties =
            [
                CreateProperty("AREA_CITY", location.City),
                CreateProperty("AREA_COUNTY", location.County),
                CreateProperty("AREA_SERVICE", location.ServiceArea),
                CreateProperty("AREA_ZIP", location.ZipCode)
            ]
        };
    }

    private (double Latitude, double Longitude) GetUniqueCoordinate(DemoLocation location)
    {
        (double Latitude, double Longitude) coordinate;

        do
        {
            coordinate = (
                location.Latitude + GetCoordinateOffset(),
                location.Longitude + GetCoordinateOffset());
        }
        while (!_usedCoordinates.Add(coordinate));

        return coordinate;
    }

    private double GetCoordinateOffset()
    {
        double offset = (_random.NextDouble() * 0.004) + 0.001;

        return _random.Next(2) == 0 ? -offset : offset;
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
