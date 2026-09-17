import type { LayerProps } from 'react-map-gl/mapbox';
import type { ExpressionSpecification } from 'mapbox-gl';
import { LARGE_OUTAGE_CUSTOMERS, MAX_MARKER_RADIUS, SIZE_STEPS, STATUS_COLORS, UNKNOWN_STATUS_COLOR } from '@/lib/outages';
import { STATUS_IMAGE_EXPRESSION } from './markerImages';

export const ARRIVAL_RADIUS_FROM = SIZE_STEPS[0].radius;
export const ARRIVAL_RADIUS_TO = 40;

export const CLUSTER_MAX_ZOOM = 11;
export const CLUSTER_RADIUS = 44;
export const CLUSTER_MIN_POINTS = 3;

const SIZE_FACTOR = 2.15;

const SMALLEST_CLUSTER_PX = 14;
const LARGEST_CLUSTER_PX = 30;

const HALO_PADDING_PX = 5;
const LARGE_RING_PADDING_PX = 6;

const CUSTOMER_STOPS = [1, 5, 10, 25, 50, 100, 250, 500, 1000];

function clamp(value: number, smallest: number, largest: number): number {
    return Math.min(largest, Math.max(smallest, value));
}

function radiusForCustomers(customers: number, smallestPx: number, largestPx: number): number {
    return clamp(SIZE_FACTOR * Math.sqrt(customers), smallestPx, largestPx);
}

function clusterRadiusOf(customers: number): number {
    return radiusForCustomers(customers, SMALLEST_CLUSTER_PX, LARGEST_CLUSTER_PX);
}

function stopsFrom(radiusOf: (customers: number) => number): number[] {
    return CUSTOMER_STOPS.flatMap(customers => [customers, radiusOf(customers)]);
}

const pointCustomers: ExpressionSpecification = ["coalesce", ["get", "numPeople"], 1];
const clusterCustomers: ExpressionSpecification = ["coalesce", ["get", "customers"], 1];

function radiusExpression(
    customers: ExpressionSpecification,
    radiusOf: (customers: number) => number
): ExpressionSpecification {
    return ["interpolate", ["linear"], customers, ...stopsFrom(radiusOf)] as ExpressionSpecification;
}

const pointRadius = [
    "step",
    pointCustomers,
    SIZE_STEPS[0].radius,
    ...SIZE_STEPS.slice(1).flatMap(step => [step.minCustomers, step.radius])
] as ExpressionSpecification;

const haloRadius: ExpressionSpecification = ["+", pointRadius, HALO_PADDING_PX];
const largeRingRadius: ExpressionSpecification = ["+", pointRadius, LARGE_RING_PADDING_PX];
const clusterRadius = radiusExpression(clusterCustomers, clusterRadiusOf);
const clusterLabel: ExpressionSpecification = ["get", "point_count_abbreviated"];

const STATUS_COLOR_EXPRESSION: ExpressionSpecification = [
    "match",
    ["get", "status"],
    "Pending Assessment", STATUS_COLORS["Pending Assessment"],
    "Crew Assessing", STATUS_COLORS["Crew Assessing"],
    "Planned Outage", STATUS_COLORS["Planned Outage"],
    "Further Assessment Needed", STATUS_COLORS["Further Assessment Needed"],
    UNKNOWN_STATUS_COLOR
];

export const clusterLayer = {
    id: "outage-clusters",
    type: "circle",
    filter: ["has", "point_count"],
    paint: {
        "circle-emissive-strength": 1,
        "circle-radius": clusterRadius,
        "circle-color": "rgba(203, 213, 225, 0.95)",
        "circle-stroke-width": 1,
        "circle-stroke-color": "rgba(4, 7, 12, 0.88)",
        "circle-radius-transition": { duration: 220 }
    }
} satisfies LayerProps;

export const clusterCountLayer = {
    id: "outage-cluster-count",
    type: "symbol",
    filter: ["has", "point_count"],
    layout: {
        "text-field": clusterLabel,
        "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
        "text-size": 12,
        "text-allow-overlap": true
    },
    paint: { "text-color": "rgba(8, 10, 14, 0.92)" }
} satisfies LayerProps;

export const outageHaloLayer = {
    id: "outage-halos",
    type: "circle",
    filter: ["!", ["has", "point_count"]],
    paint: {
        "circle-emissive-strength": 1,
        "circle-radius": haloRadius,
        "circle-color": STATUS_COLOR_EXPRESSION,
        "circle-opacity": 0.16,
        "circle-blur": 0.55
    }
} satisfies LayerProps;

export const outageLargeRingLayer = {
    id: "outage-large-rings",
    type: "circle",
    filter: ["all", ["!", ["has", "point_count"]], [">=", pointCustomers, LARGE_OUTAGE_CUSTOMERS]],
    paint: {
        "circle-emissive-strength": 1,
        "circle-radius": largeRingRadius,
        "circle-color": "rgba(0, 0, 0, 0)",
        "circle-stroke-width": 1.5,
        "circle-stroke-opacity": 0.7,
        "circle-stroke-color": STATUS_COLOR_EXPRESSION
    }
} satisfies LayerProps;

export const outageLayer = {
    id: "outage-points",
    type: "symbol",
    filter: ["!", ["has", "point_count"]],
    layout: {
        "icon-image": STATUS_IMAGE_EXPRESSION,
        "icon-size": ["/", pointRadius, MAX_MARKER_RADIUS],
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
        "symbol-sort-key": ["-", pointCustomers]
    },
    paint: {
        "icon-emissive-strength": 1
    }
} satisfies LayerProps;

export const arrivalLayer = {
    id: "outage-arrivals",
    type: "circle",
    paint: {
        "circle-emissive-strength": 1,
        "circle-radius": ARRIVAL_RADIUS_FROM,
        "circle-opacity": 0,
        "circle-stroke-width": 2,
        "circle-stroke-opacity": 0.9,
        "circle-stroke-color": STATUS_COLOR_EXPRESSION
    }
} satisfies LayerProps;