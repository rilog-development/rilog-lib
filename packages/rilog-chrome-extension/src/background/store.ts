import { ERilogEvent, IRilogRequestItem } from '@rilog-development/rilog-shared';
import { IExtensionEvent } from '../types/messages';

const MAX_EVENTS_PER_TAB = 2000;
const DEDUPE_WINDOW_MS = 4000;

interface IRecentRequest {
    key: string;
    extensionEventId: string;
    source: IExtensionEvent['source'];
    addedAt: number;
}

const store = new Map<number, IExtensionEvent[]>();
const recentRequests = new Map<number, IRecentRequest[]>();

function requestDedupeKey(extEvent: IExtensionEvent): string | null {
    if (extEvent.event.type !== ERilogEvent.REQUEST) return null;
    const item = extEvent.event.data as IRilogRequestItem;
    return `${item.request.method}:${item.request.url}`;
}

export type TAddResult = { kind: 'added'; event: IExtensionEvent } | { kind: 'updated'; event: IExtensionEvent } | { kind: 'dropped' };

/**
 * Own MAIN-world capture and rilog-lib's optional onPushEvent bridge can both report the same
 * request. We prefer the bridge version (it already went through rilog-lib's own sensitive-data
 * masking) when both show up within a short window for the same method+url.
 */
export function addEvent(tabId: number, extEvent: IExtensionEvent): TAddResult {
    const list = store.get(tabId) ?? [];
    const key = requestDedupeKey(extEvent);

    if (key) {
        const now = Date.now();
        const recents = (recentRequests.get(tabId) ?? []).filter((r) => now - r.addedAt < DEDUPE_WINDOW_MS);
        const matchIdx = recents.findIndex((r) => r.key === key);

        if (matchIdx !== -1) {
            const existing = recents[matchIdx];

            if (existing.source === 'capture' && extEvent.source === 'bridge') {
                const idx = list.findIndex((e) => e.id === existing.extensionEventId);
                if (idx !== -1) {
                    list[idx] = extEvent;
                    recents[matchIdx] = { key, extensionEventId: extEvent.id, source: 'bridge', addedAt: now };
                    recentRequests.set(tabId, recents);
                    store.set(tabId, list);
                    return { kind: 'updated', event: extEvent };
                }
            }

            // bridge already covers this request, or it's a same-source repeat — drop the noise
            recentRequests.set(tabId, recents);
            return { kind: 'dropped' };
        }

        recents.push({ key, extensionEventId: extEvent.id, source: extEvent.source, addedAt: now });
        recentRequests.set(tabId, recents);
    }

    list.push(extEvent);
    if (list.length > MAX_EVENTS_PER_TAB) list.splice(0, list.length - MAX_EVENTS_PER_TAB);
    store.set(tabId, list);
    return { kind: 'added', event: extEvent };
}

export function getEvents(tabId: number): IExtensionEvent[] {
    return store.get(tabId) ?? [];
}

export function getEvent(tabId: number, extensionEventId: string): IExtensionEvent | undefined {
    return store.get(tabId)?.find((e) => e.id === extensionEventId);
}

export function clearEvents(tabId: number): void {
    store.delete(tabId);
    recentRequests.delete(tabId);
}

export function dropTab(tabId: number): void {
    store.delete(tabId);
    recentRequests.delete(tabId);
}
