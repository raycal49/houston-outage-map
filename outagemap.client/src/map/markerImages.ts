import type { ExpressionSpecification, Map as MapboxMap } from 'mapbox-gl';
import lightningSlashSvg from '@phosphor-icons/core/assets/fill/lightning-slash-fill.svg?raw';
import { MAX_MARKER_RADIUS, PLANNED_STATUS, STATUS_COLORS, UNKNOWN_STATUS_COLOR } from '@/lib/outages';

const PIXEL_RATIO = 2;
const OUTLINE_COLOR = '#253145';
const OUTLINE_WIDTH = 2.5;
const SYMBOL_COLOR = '#0b0d12';
const ICON_GRID = 256;

type MarkerImage = { color: string; planned: boolean };

const MARKER_IMAGES: Record<string, MarkerImage> = {
    'outage-pending': { color: STATUS_COLORS['Pending Assessment'], planned: false },
    'outage-crew': { color: STATUS_COLORS['Crew Assessing'], planned: false },
    'outage-further': { color: STATUS_COLORS['Further Assessment Needed'], planned: false },
    'outage-unknown': { color: UNKNOWN_STATUS_COLOR, planned: false },
    'outage-planned': { color: STATUS_COLORS[PLANNED_STATUS], planned: true }
};

export const STATUS_IMAGE_EXPRESSION: ExpressionSpecification = [
    "match",
    ["get", "status"],
    "Pending Assessment", "outage-pending",
    "Crew Assessing", "outage-crew",
    "Further Assessment Needed", "outage-further",
    PLANNED_STATUS, "outage-planned",
    "outage-unknown"
];

const symbols = new Map<string, Path2D>();

function pathFromSvg(svg: string): Path2D {
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    const path = new Path2D();

    for (const node of doc.querySelectorAll('path')) {
        const d = node.getAttribute('d');
        if (d) path.addPath(new Path2D(d));
    }

    return path;
}

function symbolFor(svg: string): Path2D {
    let symbol = symbols.get(svg);

    if (!symbol) {
        symbol = pathFromSvg(svg);
        symbols.set(svg, symbol);
    }

    return symbol;
}

function drawMarker({ color, planned }: MarkerImage): ImageData | null {
    const radius = MAX_MARKER_RADIUS * PIXEL_RATIO;
    const size = radius * 2 + OUTLINE_WIDTH * 2 * PIXEL_RATIO;
    const center = size / 2;

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.beginPath();
    if (planned) ctx.roundRect(center - radius * 0.9, center - radius * 0.9, radius * 1.8, radius * 1.8, radius * 0.38);
    else ctx.arc(center, center, radius, 0, Math.PI * 2);

    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = OUTLINE_WIDTH * PIXEL_RATIO;
    ctx.strokeStyle = OUTLINE_COLOR;
    ctx.stroke();

    const symbol = radius * (planned ? 1.1 : 1.2);
    ctx.translate(center - symbol / 2, center - symbol / 2);
    ctx.scale(symbol / ICON_GRID, symbol / ICON_GRID);
    ctx.fillStyle = SYMBOL_COLOR;
    ctx.fill(symbolFor(lightningSlashSvg));

    return ctx.getImageData(0, 0, size, size);
}

export function addMarkerImage(map: MapboxMap, id: string): void {
    const image = MARKER_IMAGES[id];
    if (!image || map.hasImage(id)) return;

    const data = drawMarker(image);
    if (data) map.addImage(id, data, { pixelRatio: PIXEL_RATIO });
}

export function addMarkerImages(map: MapboxMap): void {
    for (const id of Object.keys(MARKER_IMAGES)) addMarkerImage(map, id);
}
