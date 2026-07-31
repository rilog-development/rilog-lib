import { ERilogEvent, IRilogClick, IRilogConsoleData, IRilogEventItem, IRilogInput, IRilogMessageData, IRilogRequestItem } from '@rilog-development/rilog-shared';

export const EVENT_TYPE_LABEL: Record<ERilogEvent, string> = {
    [ERilogEvent.REQUEST]: 'Request',
    [ERilogEvent.CLICK]: 'Click',
    [ERilogEvent.INPUT]: 'Input',
    [ERilogEvent.CONSOLE_ERROR]: 'Console error',
    [ERilogEvent.CONSOLE_WARN]: 'Console warn',
    [ERilogEvent.DEBUG_MESSAGE]: 'Debug',
};

export const EVENT_TYPE_BADGE: Record<ERilogEvent, string> = {
    [ERilogEvent.REQUEST]: 'REQUEST',
    [ERilogEvent.CLICK]: 'CLICK',
    [ERilogEvent.INPUT]: 'INPUT',
    [ERilogEvent.CONSOLE_ERROR]: 'CONSOLE_ERROR',
    [ERilogEvent.CONSOLE_WARN]: 'CONSOLE_WARN',
    [ERilogEvent.DEBUG_MESSAGE]: 'DEBUG',
};

export function typeColorVar(type: ERilogEvent): { fg: string; bg: string } {
    switch (type) {
        case ERilogEvent.REQUEST:
            return { fg: 'var(--type-request)', bg: 'var(--type-request-bg)' };
        case ERilogEvent.CLICK:
            return { fg: 'var(--type-click)', bg: 'var(--type-click-bg)' };
        case ERilogEvent.INPUT:
            return { fg: 'var(--type-input)', bg: 'var(--type-input-bg)' };
        case ERilogEvent.CONSOLE_WARN:
            return { fg: 'var(--type-console-warn)', bg: 'var(--type-console-warn-bg)' };
        case ERilogEvent.CONSOLE_ERROR:
            return { fg: 'var(--type-console-error)', bg: 'var(--type-console-error-bg)' };
        case ERilogEvent.DEBUG_MESSAGE:
            return { fg: 'var(--type-debug)', bg: 'var(--type-debug-bg)' };
        default:
            return { fg: 'var(--text-muted)', bg: 'var(--surface-2)' };
    }
}

export type TRequestSeverity = 'ok' | 'warn' | 'error';

/** Non-numeric statuses ("network_error", "timeout", from capture.ts) are real failures too —
 * previously these fell through to a neutral color and matched no status filter at all. */
export function requestSeverity(status: string | number | null | undefined): TRequestSeverity {
    const code = Number(status);
    if (Number.isNaN(code)) return 'error';
    if (code >= 500) return 'error';
    if (code >= 400) return 'warn';
    return 'ok';
}

export function statusColorVar(status: string | number | null | undefined): string {
    const severity = requestSeverity(status);
    if (severity === 'error') return 'var(--status-5xx)';
    if (severity === 'warn') return 'var(--status-4xx)';
    return 'var(--status-2xx)';
}

function pad(n: number): string {
    return String(n).padStart(2, '0');
}

function toDate(dateLike: string | number): Date {
    const ms = typeof dateLike === 'number' ? dateLike : Number(dateLike);
    return Number.isNaN(ms) ? new Date(dateLike) : new Date(ms);
}

/** Fixed DD.MM.YYYY HH:mm:ss — locale-independent so it doesn't depend on the machine's
 * regional format (and doesn't come out as a raw ISO string like the request/response timestamps did). */
export function formatTime(dateLike: string | number): string {
    const d = toDate(dateLike);
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function formatTimeOnly(dateLike: string | number): string {
    const d = toDate(dateLike);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** One-line row summary — mirrors what the rilog-local-server dashboard shows per row. */
export function summarizeEvent(item: IRilogEventItem): { primary: string; secondary?: string; status?: string | null } {
    switch (item.type) {
        case ERilogEvent.REQUEST: {
            const data = item.data as IRilogRequestItem;
            return { primary: data.request.method, secondary: data.request.url, status: data.response.status };
        }
        case ERilogEvent.CLICK: {
            const data = item.data as IRilogClick;
            return { primary: data.inner ? `«${data.inner}»` : data.nodeName, secondary: data.classNames || data.id };
        }
        case ERilogEvent.INPUT: {
            const data = item.data as IRilogInput;
            return { primary: data.name || data.nodeName, secondary: data.inputType };
        }
        case ERilogEvent.CONSOLE_WARN:
        case ERilogEvent.CONSOLE_ERROR: {
            const data = item.data as IRilogConsoleData;
            return { primary: data.message, secondary: data.source };
        }
        case ERilogEvent.DEBUG_MESSAGE: {
            const data = item.data as IRilogMessageData;
            return { primary: data.label || 'message', secondary: data.data };
        }
        default:
            return { primary: 'Unknown event' };
    }
}

export function isRequestEvent(item: IRilogEventItem): item is IRilogEventItem & { data: IRilogRequestItem } {
    return item.type === ERilogEvent.REQUEST;
}
