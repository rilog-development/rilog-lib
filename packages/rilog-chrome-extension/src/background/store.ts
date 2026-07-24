import { ERilogEvent, IRilogRequestItem } from '@rilog-development/rilog-shared';
import { IExtensionEvent } from '../types/messages';

const MAX_EVENTS_PER_TAB = 2000;
const DEDUPE_WINDOW_MS = 4000;
const EVENTS_KEY_PREFIX = 'rilog_events_tab_';

interface IRecentRequest {
    key: string;
    extensionEventId: string;
    source: IExtensionEvent['source'];
    addedAt: number;
}

// Short-lived dedupe bookkeeping only — safe to lose on a service worker restart (worst case a
// handful of duplicate rows right around the restart). The actual event log below must survive
// restarts, so it lives in chrome.storage.session, not a module-level variable: MV3 service
// workers are ephemeral and get unloaded after ~30s idle, wiping any plain in-memory state.
const recentRequests = new Map<number, IRecentRequest[]>();

function storageKey(tabId: number): string {
    return `${EVENTS_KEY_PREFIX}${tabId}`;
}

async function readEvents(tabId: number): Promise<IExtensionEvent[]> {
    const key = storageKey(tabId);
    const result = await chrome.storage.session.get(key);
    return (result[key] as IExtensionEvent[] | undefined) ?? [];
}

async function writeEvents(tabId: number, events: IExtensionEvent[]): Promise<void> {
    await chrome.storage.session.set({ [storageKey(tabId)]: events });
}

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
export async function addEvent(tabId: number, extEvent: IExtensionEvent): Promise<TAddResult> {
    const list = await readEvents(tabId);
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
                    await writeEvents(tabId, list);
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
    await writeEvents(tabId, list);
    return { kind: 'added', event: extEvent };
}

export async function getEvents(tabId: number): Promise<IExtensionEvent[]> {
    return readEvents(tabId);
}

export async function getEvent(tabId: number, extensionEventId: string): Promise<IExtensionEvent | undefined> {
    const list = await readEvents(tabId);
    return list.find((e) => e.id === extensionEventId);
}

export async function clearEvents(tabId: number): Promise<void> {
    await chrome.storage.session.remove(storageKey(tabId));
    recentRequests.delete(tabId);
}

export async function dropTab(tabId: number): Promise<void> {
    await chrome.storage.session.remove(storageKey(tabId));
    recentRequests.delete(tabId);
}
