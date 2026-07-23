import { IRilogEventItem } from '@rilog-development/rilog-shared';
import { IRilogRule } from './rules';

/** window.postMessage source tags used by the page <-> content-script bridge. */
export const BRIDGE_SOURCE_CAPTURE = 'rilog-devtools-capture';
export const BRIDGE_SOURCE_LIB = 'rilog-devtools-bridge';

/** chrome.storage.local key for the popup's pause/resume toggle, read by content/bridge.ts. */
export const CAPTURE_ENABLED_STORAGE_KEY = 'rilog_capture_enabled';

export type TCaptureSource = 'capture' | 'bridge';

export interface IPageBridgeMessage {
    source: typeof BRIDGE_SOURCE_CAPTURE | typeof BRIDGE_SOURCE_LIB;
    event: IRilogEventItem;
}

/** A captured event as stored/relayed inside the extension (tab-scoped, rule-annotated). */
export interface IExtensionEvent {
    id: string;
    event: IRilogEventItem;
    tabId: number;
    source: TCaptureSource;
    matchedRuleIds: string[];
    receivedAt: number;
}

export type TRuntimeMessage =
    | { type: 'rilog/event'; source: TCaptureSource; event: IRilogEventItem }
    | { type: 'rilog/get-events'; tabId: number }
    | { type: 'rilog/clear-events'; tabId: number }
    | { type: 'rilog/get-rules' }
    | { type: 'rilog/save-rule'; rule: IRilogRule }
    | { type: 'rilog/delete-rule'; ruleId: string }
    | { type: 'rilog/share-event'; extensionEventId: string; tabId: number };

export type TRuntimeResponse =
    | { type: 'rilog/events'; events: IExtensionEvent[] }
    | { type: 'rilog/rules'; rules: IRilogRule[] }
    | { type: 'rilog/share-result'; url: string }
    | { type: 'rilog/error'; message: string }
    | { type: 'rilog/ok' };

/** Port name prefix used by the DevTools panel: `${DEVTOOLS_PORT_PREFIX}:${inspectedTabId}` */
export const DEVTOOLS_PORT_PREFIX = 'rilog-devtools-panel';

export type TPortMessage = { type: 'rilog/event-added'; event: IExtensionEvent } | { type: 'rilog/event-updated'; event: IExtensionEvent } | { type: 'rilog/events-cleared' };
