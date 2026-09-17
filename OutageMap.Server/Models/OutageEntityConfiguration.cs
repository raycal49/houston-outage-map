using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace OutageMap.Server.Models;

public sealed class OutageEntityConfiguration: IEntityTypeConfiguration<OutageEntity>
{
    public void Configure(EntityTypeBuilder<OutageEntity> builder)
    {
        builder.HasKey(x => x.Id);

        builder.HasIndex(x => x.SourceId)
            .IsUnique();

        builder.Property(x => x.Location)
            .HasColumnType("geography");

        builder.ToTable("Outages", t => t.IsTemporal(h =>
        {
            h.HasPeriodStart("ValidFrom");
            h.HasPeriodEnd("ValidTo");
            h.UseHistoryTable("OutagesHistory");
        }));
    }
}
