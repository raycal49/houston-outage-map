// outagemap.client/src/lib/outages.ts

import type { Feature, FeatureCollection, Point } from 'geojson';

export type OutageProperties = {
    id?: number;
    startTime?: number;
    etrTime?: number | null;
    numPeople?: number;
    status?: string;
    cause?: string | null;
    city?: string | null;
    county?: string | null;
    serviceArea?: string | null;
    zipCode?: string | null;
};

export type OutageFeature = Feature<Point, OutageProperties>;
export type OutageCollection = FeatureCollection<Point, OutageProperties>;

export function collectIds(fc: OutageCollection): Set<number> {
    const ids = new Set<number>();

    for (const feature of fc.features) {
        const id = feature.properties?.id;
        if (typeof id === 'number') ids.add(id);
    }

    return ids;
}

export function featuresWithNewIds(fc: OutageCollection, previousIds: Set<number>): OutageFeature[] {
    return fc.features.filter(feature => {
        const id = feature.properties?.id;
        return typeof id === 'number' && !previousIds.has(id);
    });
}

export const STATUS_COLORS: Record<string, string> = {
    'Pending Assessment': '#E69F00',
    'Crew Assessing': '#56B4E9',
    'Further Assessment Needed': '#CC79A7',
    'Planned Outage': '#009E73'
};

export const UNKNOWN_STATUS_COLOR = '#94a3b8';

export const PLANNED_STATUS = 'Planned Outage';

export const SIZE_STEPS = [
    { label: 'Small', minCustomers: 0, radius: 10 },
    { label: 'Moderate', minCustomers: 11, radius: 14 },
    { label: 'Large', minCustomers: 101, radius: 19 }
] as const;

export const MAX_MARKER_RADIUS = SIZE_STEPS[SIZE_STEPS.length - 1].radius;
export const LARGE_OUTAGE_CUSTOMERS = SIZE_STEPS[SIZE_STEPS.length - 1].minCustomers;

export const STATUS_ORDER = [
    'Pending Assessment',
    'Crew Assessing',
    'Further Assessment Needed',
    'Planned Outage'
];

export function statusColor(status: string | undefined): string {
    return (status && STATUS_COLORS[status]) || UNKNOWN_STATUS_COLOR;
}

export const UNCLASSIFIED_STATUS = 'Unclassified';

export const TREND_HOURS = 6;

export type StatusCount = { status: string; count: number; color: string;};
export type TrendBucket = { label: string; count: number };

export type OutageSummary = {
    total: number;
    customers: number;
    largest: number;
    byStatus: StatusCount[];
    trend: TrendBucket[];
};

export function summariseOutages(fc: OutageCollection | null, now: number = Date.now()): OutageSummary {
    const counts = new Map<string, number>();
    const features = fc?.features ?? [];

    let customers = 0;
    let largest = 0;

    const trend: TrendBucket[] = [];
    for (let hoursBack = TREND_HOURS - 1; hoursBack >= 0; hoursBack--) {
        trend.push({ label: hoursBack === 0 ? 'now' : `-${hoursBack}h`, count: 0 });
    }

    for (const feature of features) {
        const properties = feature.properties ?? {};
        const status = properties.status ?? UNCLASSIFIED_STATUS;

        counts.set(status, (counts.get(status) ?? 0) + 1);

        const affected = typeof properties.numPeople === 'number' ? properties.numPeople : 0;
        customers += affected;
        if (affected > largest) largest = affected;

        if (typeof properties.startTime === 'number') {
            const hoursAgo = (now - properties.startTime) / 3_600_000;

            if (hoursAgo >= 0 && hoursAgo < TREND_HOURS)
                trend[TREND_HOURS - 1 - Math.floor(hoursAgo)].count += 1;
        }
    }

    const byStatus: StatusCount[] = STATUS_ORDER.map(status => ({
        status,
        count: counts.get(status) ?? 0,
        color: statusColor(status)
    }));

    for (const [status, count] of counts) {
        if (!STATUS_ORDER.includes(status))
            byStatus.push({
                status,
                count,
                color: UNKNOWN_STATUS_COLOR
            });
    }

    return { total: features.length, customers, largest, byStatus, trend };
}