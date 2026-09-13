using OutageMap.Server.Demo;
using OutageMap.Server.Dtos;

namespace OutageMap.Server.Infrastructure.Http;

public class DemoSource : IOutageSource
{
    private readonly OutageSimulator _simulator;

    public DemoSource(OutageSimulator simulator)
    {
        _simulator = simulator;
    }

    public Task<List<OutageDto>> GetOutageData()
    {
        return Task.FromResult(_simulator.GetSimulatedOutages());
    }
}
