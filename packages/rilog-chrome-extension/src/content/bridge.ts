/**
 * Runs in the isolated world (default content-script world) — has chrome.* API access but a
 * separate JS global scope from the page, so it can't patch window.fetch itself. It only relays:
 *  - `rilog-devtools-capture` messages from capture.ts (this extension's own MAIN-world capture)
 *  - `rilog-devtools-bridge` messages from a page that has rilog-lib configured with
 *    `onPushEvent: (event) => window.postMessage({ source: 'rilog-devtools-bridge', event }, '*')`
 *    — optional, richer/official data (already through rilog-lib's own sensitive-data masking).
 * Background dedupes the two when both show up for what looks like the same request.
 */
import { IRilogEventItem } from '@rilog-development/rilog-shared';
import { BRIDGE_SOURCE_CAPTURE, BRIDGE_SOURCE_LIB, CAPTURE_ENABLED_STORAGE_KEY, TCaptureSource, TRuntimeMessage } from '../types/messages';

function isBridgeEvent(data: unknown): data is { source: string; event: IRilogEventItem } {
    return typeof data === 'object' && data !== null && 'source' in data && 'event' in data && ((data as any).source === BRIDGE_SOURCE_CAPTURE || (data as any).source === BRIDGE_SOURCE_LIB);
}

// Cached locally (rather than re-read per event) since the popup's pause toggle only needs
// to take effect for new events, not retroactively — chrome.storage reads are async.
let captureEnabled = true;

chrome.storage.local.get(CAPTURE_ENABLED_STORAGE_KEY).then((result) => {
    captureEnabled = result[CAPTURE_ENABLED_STORAGE_KEY] ?? true;
});

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && CAPTURE_ENABLED_STORAGE_KEY in changes) {
        captureEnabled = changes[CAPTURE_ENABLED_STORAGE_KEY].newValue ?? true;
    }
});

window.addEventListener('message', (e: MessageEvent) => {
    if (e.source !== window) return;
    if (!captureEnabled) return;
    if (!isBridgeEvent(e.data)) return;

    const source: TCaptureSource = e.data.source === BRIDGE_SOURCE_LIB ? 'bridge' : 'capture';
    const message: TRuntimeMessage = { type: 'rilog/event', source, event: e.data.event };

    chrome.runtime.sendMessage(message).catch(() => {
        // background may not be ready yet (e.g. right after install) — safe to drop
    });
});
