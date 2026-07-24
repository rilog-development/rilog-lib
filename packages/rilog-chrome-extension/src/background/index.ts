import { ERilogEvent, IRilogRequestItem } from '@rilog-development/rilog-shared';
import { DEVTOOLS_PORT_PREFIX, IExtensionEvent, TPortMessage, TRuntimeMessage, TRuntimeResponse } from '../types/messages';
import { matchAllRules, runNotifyActions, summarizeEvent, getRules, saveRule, deleteRule, importRules } from './rules';
import { getSettings, isUrlIgnored, saveSettings } from './settings';
import { addEvent, clearEvents, dropTab, getEvent, getEvents } from './store';
import { LocalShareAdapter } from './share/LocalShareAdapter';

const shareAdapter = new LocalShareAdapter();
const panelPorts = new Map<number, Set<chrome.runtime.Port>>();

function portsForTab(tabId: number): Set<chrome.runtime.Port> {
    let ports = panelPorts.get(tabId);
    if (!ports) {
        ports = new Set();
        panelPorts.set(tabId, ports);
    }
    return ports;
}

function broadcastToTab(tabId: number, message: TPortMessage): void {
    for (const port of portsForTab(tabId)) {
        try {
            port.postMessage(message);
        } catch {
            // port likely disconnected already; onDisconnect will clean it up
        }
    }
}

chrome.runtime.onConnect.addListener((port) => {
    if (!port.name.startsWith(`${DEVTOOLS_PORT_PREFIX}:`)) return;

    const tabId = Number(port.name.slice(DEVTOOLS_PORT_PREFIX.length + 1));
    const ports = portsForTab(tabId);
    ports.add(port);

    port.onDisconnect.addListener(() => {
        ports.delete(port);
    });
});

chrome.tabs.onRemoved.addListener((tabId) => {
    dropTab(tabId);
    panelPorts.delete(tabId);
});

async function handleEvent(message: Extract<TRuntimeMessage, { type: 'rilog/event' }>, tabId: number): Promise<void> {
    const extEvent: IExtensionEvent = {
        id: message.event._id,
        event: message.event,
        tabId,
        source: message.source,
        matchedRuleIds: [],
        receivedAt: Date.now(),
    };

    // The simple global "ignored URL" denylist (Settings) is checked before rules even run —
    // it's the lightweight path for "just don't track this domain" without writing a rule.
    if (extEvent.event.type === ERilogEvent.REQUEST) {
        const settings = await getSettings();
        const url = (extEvent.event.data as IRilogRequestItem).request.url;
        if (isUrlIgnored(url, settings.ignoredUrlPatterns)) return;
    }

    const rules = await getRules();
    const matched = matchAllRules(rules, extEvent);

    // "ignore" rules mean "don't capture this at all" — drop before it's ever stored/shown/notified.
    if (matched.some((r) => r.actions.some((a) => a.type === 'ignore'))) return;

    extEvent.matchedRuleIds = matched.map((r) => r.id);

    const result = await addEvent(tabId, extEvent);
    if (result.kind === 'dropped') return;

    runNotifyActions(matched, extEvent);
    broadcastToTab(tabId, { type: result.kind === 'added' ? 'rilog/event-added' : 'rilog/event-updated', event: result.event });

    // Native chrome.notifications works even when the panel isn't open; this additionally drives
    // an in-panel toast + sound for whoever is actively watching the panel right now.
    for (const rule of matched) {
        for (const action of rule.actions) {
            if (action.type === 'notify') {
                broadcastToTab(tabId, { type: 'rilog/notify', title: action.title || rule.name || 'Rilog', body: action.body || summarizeEvent(extEvent), extensionEventId: extEvent.id });
            }
        }
    }
}

chrome.runtime.onMessage.addListener((message: TRuntimeMessage, sender, sendResponse: (response: TRuntimeResponse) => void) => {
    (async () => {
        try {
            switch (message.type) {
                case 'rilog/event': {
                    const tabId = sender.tab?.id;
                    if (tabId !== undefined) await handleEvent(message, tabId);
                    sendResponse({ type: 'rilog/ok' });
                    return;
                }
                case 'rilog/get-events': {
                    sendResponse({ type: 'rilog/events', events: await getEvents(message.tabId) });
                    return;
                }
                case 'rilog/clear-events': {
                    await clearEvents(message.tabId);
                    broadcastToTab(message.tabId, { type: 'rilog/events-cleared' });
                    sendResponse({ type: 'rilog/ok' });
                    return;
                }
                case 'rilog/get-rules': {
                    sendResponse({ type: 'rilog/rules', rules: await getRules() });
                    return;
                }
                case 'rilog/save-rule': {
                    sendResponse({ type: 'rilog/rules', rules: await saveRule(message.rule) });
                    return;
                }
                case 'rilog/delete-rule': {
                    sendResponse({ type: 'rilog/rules', rules: await deleteRule(message.ruleId) });
                    return;
                }
                case 'rilog/import-rules': {
                    sendResponse({ type: 'rilog/rules', rules: await importRules(message.rules) });
                    return;
                }
                case 'rilog/share-event': {
                    const extEvent = await getEvent(message.tabId, message.extensionEventId);
                    if (!extEvent) {
                        sendResponse({ type: 'rilog/error', message: 'Event not found' });
                        return;
                    }
                    const result = await shareAdapter.publish(extEvent.event);
                    sendResponse({ type: 'rilog/share-result', url: result.url });
                    return;
                }
                case 'rilog/get-settings': {
                    sendResponse({ type: 'rilog/settings', settings: await getSettings() });
                    return;
                }
                case 'rilog/save-settings': {
                    sendResponse({ type: 'rilog/settings', settings: await saveSettings(message.settings) });
                    return;
                }
            }
        } catch (err) {
            sendResponse({ type: 'rilog/error', message: err instanceof Error ? err.message : String(err) });
        }
    })();

    return true; // keep the message channel open for the async response above
});
