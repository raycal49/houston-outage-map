import type { LayerProps } from 'react-map-gl/mapbox';
import type { ExpressionSpecification } from 'mapbox-gl';
import { STATUS_COLORS, UNKNOWN_STATUS_COLOR } from '@/lib/outages';

export const ARRIVAL_RADIUS_FROM = 6;
export const ARRIVAL_RADIUS_TO = 40;

export const CLUSTER_MAX_ZOOM = 11;
export const CLUSTER_RADIUS = 44;
export const CLUSTER_MIN_POINTS = 3;

const SIZE_FACTOR = 2.15;

const SMALLEST_POINT_PX = 5;
const LARGEST_POINT_PX = 18;
const SMALLEST_CLUSTER_PX = 14;
const LARGEST_CLUSTER_PX = 30;

const HALO_PADDING_PX = 5;

const CUSTOMER_STOPS = [1, 5, 10, 25, 50, 100, 250, 500, 1000];

function clamp(value: number, smallest: number, largest: number): number {
    return Math.min(largest, Math.max(smallest, value));
}

function radiusForCustomers(customers: number, smallestPx: number, largestPx: number): number {
    return clamp(SIZE_FACTOR * Math.sqrt(customers), smallestPx, largestPx);
}

function pointRadiusOf(customers: number): number {
    return radiusForCustomers(customers, SMALLEST_POINT_PX, LARGEST_POINT_PX);
}

function haloRadiusOf(customers: number): number {
    return pointRadiusOf(customers) + HALO_PADDING_PX;
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

const pointRadius = radiusExpression(pointCustomers, pointRadiusOf);
const haloRadius = radiusExpression(pointCustomers, haloRadiusOf);
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

export const outageLayer = {
    id: "outage-points",
    type: "circle",
    filter: ["!", ["has", "point_count"]],
    paint: {
        "circle-emissive-strength": 1,
        "circle-radius": pointRadius,
        "circle-opacity": 0.96,

        "circle-stroke-width": 3,
        "circle-stroke-color": "#253145",

        "circle-color": STATUS_COLOR_EXPRESSION,
        "circle-radius-transition": { duration: 180 }
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