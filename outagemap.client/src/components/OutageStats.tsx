import { PLANNED_STATUS, type OutageSummary } from '@/lib/outages';

type OutageStatsProps = {
    summary: OutageSummary;
};

const CAP = 'font-ui-mono text-2xs tracking-wider uppercase text-white/60';

export default function OutageStats({ summary }: OutageStatsProps) {
    const { total, customers, largest, byStatus } = summary;

    const tiles: { label: string; value: number }[] = [
        { label: 'Outages', value: total },
        { label: 'Customers', value: customers }
    ];

    return (
        <section
            aria-label="Outage summary"
            className="absolute top-13 left-3 z-3 flex w-68 flex-col gap-3.5 rounded-lg border
                       border-ui-border bg-ui-surface p-3.5 font-ui-sans text-ui-text shadow-panel
                       backdrop-blur-md max-sm:w-60 max-sm:gap-2.5 max-sm:p-3"
        >
            <div className="grid grid-cols-2 gap-2">
                {tiles.map(tile => (
                    <div key={tile.label} className="flex min-w-0 flex-col gap-0.5">
                        <span className="font-ui-mono text-xl leading-none tracking-tight tabular-nums max-sm:text-lg">
                            {tile.value.toLocaleString()}
                        </span>
                        <span className={CAP}>{tile.label}</span>
                    </div>
                ))}
            </div>

            {total > 0 && (
                <div aria-hidden="true" className="flex h-2 gap-0.5 overflow-hidden rounded-sm">
                    {byStatus
                        .filter(entry => entry.count > 0)
                        .map(entry => (
                            <i
                                key={entry.status}
                                className="block h-full"
                                style={{ flex: entry.count, background: entry.color }}
                            />
                        ))}
                </div>
            )}

            <ul className="flex list-none flex-col gap-2">
                {byStatus.map(entry => (
                    <li key={entry.status} className="flex items-center gap-2.5 text-xs text-white/90">
                        <span
                            aria-hidden="true"
                            className={`size-2.5 shrink-0 ${entry.status === PLANNED_STATUS ? 'rounded-[3px]' : 'rounded-full'}`}
                            style={{ background: entry.color }}
                        />
                        <span className="flex-1 truncate">{entry.status}</span>
                        <span className="font-ui-mono tabular-nums text-white">{entry.count}</span>
                    </li>
                ))}
            </ul>

            <footer className={`flex items-center justify-between gap-2 border-t border-white/10 pt-2.5 ${CAP} max-sm:hidden`}>
                <span>Largest</span>
                <span className="text-white/90 tabular-nums">{largest.toLocaleString()} customers</span>
            </footer>
        </section>
    );
}