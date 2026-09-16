using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.AspNetCore.RateLimiting;

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

    [EnableRateLimiting("GetOutageData")]
    [HttpGet("OutageData")]
    [OutputCache(PolicyName = "outages", Tags = new[] { "outages" })]
    public async Task<ActionResult> GetOutageData(CancellationToken cancellationToken)
    {
        var outages = await _outageReader.GetActiveOutages(cancellationToken);

        return Ok(outages);
    }

}
