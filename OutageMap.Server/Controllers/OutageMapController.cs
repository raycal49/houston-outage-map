using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.AspNetCore.RateLimiting;
using OutageMap.Server.Startup;

namespace OutageMap.Server.Controllers;

[Route("[controller]")]
[ApiController]
public class OutageMapController : ControllerBase
{
    private readonly IOutageReader _outageReader;

    public OutageMapController(IOutageReader outageReader)
    {
        _outageReader = outageReader;
    }

    [EnableRateLimiting(OutagePolicies.RateLimit)]
    [HttpGet("OutageData")]
    [OutputCache(PolicyName = OutagePolicies.OutputCache)]
    public async Task<ActionResult> OutageData(CancellationToken cancellationToken)
    {
        var outages = await _outageReader.GetActiveOutages(cancellationToken);

        return Ok(outages);
    }

}
