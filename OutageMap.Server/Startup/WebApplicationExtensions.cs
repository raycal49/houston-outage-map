namespace OutageMap.Server.Startup;

public static class WebApplicationExtensions
{
    public static WebApplication UseSecurityHeaders(this WebApplication app)
    {
        if (!app.Environment.IsDevelopment())
        {
            app.UseHsts();
        }

        app.Use(async (context, next) =>
        {
            var headers = context.Response.Headers;
            headers["X-Content-Type-Options"] = "nosniff";
            headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
            headers["X-Frame-Options"] = "DENY";
            headers["Content-Security-Policy"] = "frame-ancestors 'none'";
            await next();
        });

        return app;
    }

    public static WebApplication UseSwaggerInDevelopment(this WebApplication app)
    {
        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI(options => options.DisplayRequestDuration());
        }

        return app;
    }
}
