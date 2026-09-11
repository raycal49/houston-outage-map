const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function formatDuration(ms: number): string {
    const total = Math.max(0, ms);

    if (total < HOUR)
        return `${Math.max(1, Math.round(total / MINUTE))}m`;

    if (total < DAY) {
        const hours = Math.floor(total / HOUR);
        return `${hours}h ${Math.round((total % HOUR) / MINUTE)}m`;
    }

    const days = Math.floor(total / DAY);

    return `${days}d ${Math.round((total % DAY) / HOUR)}h`;
}

export function formatAge(elapsedMs: number): string {
    const seconds = Math.max(0, Math.floor(elapsedMs / 1000));

    if (seconds < 60) return `${seconds}s`;

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) return `${minutes}m`;

    const hours = Math.round(minutes / 60);

    return `${hours}h ${minutes % 60}m`;
}

export function formatRelativeEtr(etrMs: number | null | undefined, now: number = Date.now()): string {
    if (typeof etrMs !== 'number' || !Number.isFinite(etrMs))
        return 'Not yet estimated';

    const remaining = etrMs - now;

    return remaining <= 0 ? 'Overdue' : formatDuration(remaining);
}

export function formatOutageAge(startMs: number | null | undefined, now: number = Date.now()): string | null {
    if (typeof startMs !== 'number' || !Number.isFinite(startMs))
        return null;

    return formatDuration(now - startMs);
}

export function toTitleCase(value: string | null | undefined): string | null {
    if (!value) return null;

    const trimmed = value.trim();
    if (trimmed.length === 0) return null;

    return trimmed
        .toLowerCase()
        .replace(/(^|[\s/-])([a-z])/g, (_, boundary: string, letter: string) => boundary + letter.toUpperCase());
}
