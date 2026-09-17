import { CalendarDotsIcon, HardHatIcon, HourglassMediumIcon, QuestionMarkIcon, type Icon, type IconWeight } from '@phosphor-icons/react';
import { formatOutageAge, formatRelativeEtr, toTitleCase } from '@/lib/format';
import { statusColor, UNCLASSIFIED_STATUS, type OutageFeature } from '@/lib/outages';

const STATUS_ICONS: Record<string, { icon: Icon; weight: IconWeight }> = {
    'Pending Assessment': { icon: HourglassMediumIcon, weight: 'fill' },
    'Crew Assessing': { icon: HardHatIcon, weight: 'fill' },
    'Further Assessment Needed': { icon: QuestionMarkIcon, weight: 'bold' },
    'Planned Outage': { icon: CalendarDotsIcon, weight: 'fill' }
};

type OutagePopupProps = {
    outage: OutageFeature;
};

type Row = { label: string; value: string };

export default function OutagePopup({ outage }: OutagePopupProps) {
    const properties = outage.properties ?? {};
    const status = properties.status ?? UNCLASSIFIED_STATUS;
    const color = statusColor(properties.status);
    const statusIcon = properties.status ? STATUS_ICONS[properties.status] : undefined;

    const rows: Row[] = [];

    if (typeof properties.numPeople === 'number')
        rows.push({ label: 'Customers', value: properties.numPeople.toLocaleString() });

    const cause = toTitleCase(properties.cause);
    if (cause && cause.toLowerCase() !== status.toLowerCase())
        rows.push({ label: 'Cause', value: cause });

    const city = toTitleCase(properties.city);
    if (city) rows.push({ label: 'Area', value: city });

    const serviceArea = toTitleCase(properties.serviceArea);
    if (serviceArea && serviceArea !== city)
        rows.push({ label: 'Service area', value: serviceArea });

    const age = formatOutageAge(properties.startTime);
    if (age) rows.push({ label: 'Out for', value: age });

    return (
        <div
            className="popup flex w-60 flex-col gap-3 rounded-lg border border-ui-border
                       bg-ui-surface-solid p-3.5 font-ui-sans text-ui-text shadow-popup backdrop-blur-md"
        >
            {}
            <div className="flex items-center pr-5">
                <span
                    className="inline-flex items-center gap-1.5 rounded-full border py-1 pr-2.5 pl-2
                               font-ui-mono text-2xs leading-tight tracking-wider whitespace-nowrap uppercase"
                    style={{ color, borderColor: `${color}66`, background: `${color}1f` }}
                >
                    {statusIcon ? (
                        <statusIcon.icon size={13} weight={statusIcon.weight} aria-hidden="true" className="shrink-0" />
                    ) : (
                        <span className="size-1.5 shrink-0 rounded-full" style={{ background: color }} />
                    )}
                    {status}
                </span>
            </div>

            <div className="flex flex-col">
                <span className="font-ui-mono text-2xl leading-none tracking-tight tabular-nums">
                    {formatRelativeEtr(properties.etrTime)}
                </span>
                <span className="font-ui-mono text-2xs tracking-widest uppercase text-white/40">
                    Estimated restoration
                </span>
            </div>

            {rows.length > 0 && (
                <dl className="flex flex-col gap-1.5 border-t border-white/10 pt-2.5">
                    {rows.map(row => (
                        <div key={row.label} className="flex items-baseline justify-between gap-3">
                            <dt className="font-ui-mono text-2xs tracking-widest whitespace-nowrap uppercase text-white/40">
                                {row.label}
                            </dt>
                            <dd className="text-right text-xs text-white/95">{row.value}</dd>
                        </div>
                    ))}
                </dl>
            )}
        </div>
    );
}
