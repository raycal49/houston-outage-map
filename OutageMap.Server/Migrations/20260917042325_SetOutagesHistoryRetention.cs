using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OutageMap.Server.Migrations
{
    /// <inheritdoc />
    public partial class SetOutagesHistoryRetention : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "ALTER TABLE dbo.Outages SET (SYSTEM_VERSIONING = ON (HISTORY_RETENTION_PERIOD = 60 DAYS));");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "ALTER TABLE dbo.Outages SET (SYSTEM_VERSIONING = ON (HISTORY_RETENTION_PERIOD = 60 DAYS));");
        }
    }
}
