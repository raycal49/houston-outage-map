namespace OutageMap.Server.Demo;

internal sealed record DemoLocation(
    double Latitude,
    double Longitude,
    string City,
    string County,
    string ServiceArea,
    string ZipCode);

internal static class DemoLocations
{
    private static readonly DemoLocation[] Locations =
    [
        new(29.64404, -95.30792, "HOUSTON", "HARRIS", "SOUTH HOUSTON", "77061"),
        new(29.68874, -95.39423, "HOUSTON", "HARRIS", "BELLAIRE", "77054"),
        new(29.73612, -95.47024, "HOUSTON", "HARRIS", "BELLAIRE", "77056"),
        new(29.79631, -95.55513, "HOUSTON", "HARRIS", "SPRING BRANCH", "77043"),
        new(29.88321, -95.56609, "HOUSTON", "HARRIS", "GREENSPOINT", "77040"),
        new(29.91787, -95.33404, "HOUSTON", "HARRIS", "HUMBLE", "77039"),
        new(29.98644, -95.59042, "HOUSTON", "HARRIS", "CYPRESS", "77070"),
        new(30.01296, -95.47401, "HOUSTON", "HARRIS", "GREENSPOINT", "77068")
    ];

    public static DemoLocation GetRandom(Random random)
    {
        return Locations[random.Next(Locations.Length)];
    }
}
