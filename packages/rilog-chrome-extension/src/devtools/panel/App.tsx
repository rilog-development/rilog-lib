import { useCallback, useEffect, useMemo, useState } from 'react';
import { ERilogEvent } from '@rilog-development/rilog-shared';
import { DEVTOOLS_PORT_PREFIX, IExtensionEvent, TPortMessage, TRuntimeResponse } from '../../types/messages';
import { IRilogRule } from '../../types/rules';
import { createDefaultSettings, IRilogSettings } from '../../types/settings';
import { useTheme } from '../../ui/useTheme';
import { usePanelDock } from '../../ui/usePanelDock';
import { ThemeToggle } from '../../ui/ThemeToggle';
import { isRequestEvent } from '../../ui/eventFormat';
import { playNotifySound } from '../../ui/beep';
import { Header } from './components/Header';
import { TypeFilterChips } from './components/TypeFilterChips';
import { FilterBar, IFilterState } from './components/FilterBar';
import { EventTable } from './components/EventTable';
import { DetailPanel } from './components/DetailPanel';
import { RulesView } from './components/RulesView';
import { SettingsView } from './components/SettingsView';
import { IToast, Toasts } from './components/Toasts';

export type TPanelView = 'events' | 'rules' | 'settings';

const EMPTY_FILTERS: IFilterState = { search: '', urlContains: '', status: 'all', label: '' };
const RECONNECT_DELAY_MS = 400;

export function App() {
    const [theme, toggleTheme] = useTheme();
    const [dock, setDock] = usePanelDock();
    const [view, setView] = useState<TPanelView>('events');
    const tabId = chrome.devtools.inspectedWindow.tabId;

    const [events, setEvents] = useState<IExtensionEvent[]>([]);
    const [rules, setRules] = useState<IRilogRule[]>([]);
    const [settings, setSettings] = useState<IRilogSettings>(createDefaultSettings());
    const [toasts, setToasts] = useState<IToast[]>([]);
    const [activeTypes, setActiveTypes] = useState<Set<ERilogEvent>>(new Set());
    const [filters, setFilters] = useState<IFilterState>(EMPTY_FILTERS);
    const [activeFilterTab, setActiveFilterTab] = useState<string>('all');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const dismissToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const openEvent = useCallback((extensionEventId: string) => {
        setView('events');
        setSelectedId(extensionEventId);
    }, []);

    const loadSettings = useCallback(() => {
        chrome.runtime.sendMessage({ type: 'rilog/get-settings' }, (response: TRuntimeResponse) => {
            if (response?.type === 'rilog/settings') setSettings(response.settings);
        });
    }, []);

    useEffect(() => {
        let cancelled = false;
        let port: chrome.runtime.Port | null = null;
        let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

        const fetchEvents = () => {
            chrome.runtime.sendMessage({ type: 'rilog/get-events', tabId }, (response: TRuntimeResponse) => {
                if (!cancelled && response?.type === 'rilog/events') setEvents(response.events);
            });
        };

        const connect = () => {
            port = chrome.runtime.connect({ name: `${DEVTOOLS_PORT_PREFIX}:${tabId}` });

            port.onMessage.addListener((message: TPortMessage) => {
                if (message.type === 'rilog/event-added') {
                    setEvents((prev) => [...prev, message.event]);
                } else if (message.type === 'rilog/event-updated') {
                    setEvents((prev) => prev.map((e) => (e.id === message.event.id ? message.event : e)));
                } else if (message.type === 'rilog/events-cleared') {
                    setEvents([]);
                    setSelectedId(null);
                } else if (message.type === 'rilog/notify') {
                    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
                    setToasts((prev) => [...prev, { id, title: message.title, body: message.body, extensionEventId: message.extensionEventId }]);
                    playNotifySound();
                    setTimeout(() => dismissToast(id), 6000);
                }
            });

            // MV3 background service workers get recycled by Chrome whenever idle — when that
            // happens this port dies silently. Without reconnecting, the panel would freeze on
            // whatever it last saw even though new events keep arriving in the background.
            port.onDisconnect.addListener(() => {
                if (cancelled) return;
                reconnectTimer = setTimeout(() => {
                    fetchEvents();
                    connect();
                }, RECONNECT_DELAY_MS);
            });
        };

        fetchEvents();
        chrome.runtime.sendMessage({ type: 'rilog/get-rules' }, (response: TRuntimeResponse) => {
            if (!cancelled && response?.type === 'rilog/rules') setRules(response.rules);
        });
        loadSettings();
        connect();

        return () => {
            cancelled = true;
            if (reconnectTimer) clearTimeout(reconnectTimer);
            port?.disconnect();
        };
    }, [tabId, dismissToast, loadSettings]);

    const onClear = useCallback(() => {
        chrome.runtime.sendMessage({ type: 'rilog/clear-events', tabId });
    }, [tabId]);

    const onExport = useCallback(() => {
        const blob = new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rilog-events-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, [events]);

    const onImportFile = useCallback((file: File) => {
        file.text().then((text) => {
            let parsed: unknown;
            try {
                parsed = JSON.parse(text);
            } catch {
                return; // not valid JSON — silently ignore
            }
            if (!Array.isArray(parsed)) return;

            setEvents((prev) => {
                const existingIds = new Set(prev.map((e) => e.id));
                const imported = (parsed as IExtensionEvent[]).filter((e) => e && typeof e === 'object' && e.id && e.event && !existingIds.has(e.id));
                return [...prev, ...imported];
            });
        });
    }, []);

    const filterTabNames = useMemo(() => {
        const names = new Set<string>();
        // "Pinned" is a built-in tab, not a user-named filterTab — any enabled rule with a Pin
        // action routes its matches there automatically, no extra config needed.
        if (rules.some((r) => r.enabled && r.actions.some((a) => a.type === 'pin'))) names.add('Pinned');
        for (const rule of rules) {
            if (rule.filterTab?.enabled && rule.filterTab.name) names.add(rule.filterTab.name);
        }
        return Array.from(names);
    }, [rules]);

    const typeCounts = useMemo(() => {
        const counts = new Map<ERilogEvent, number>();
        for (const e of events) counts.set(e.event.type, (counts.get(e.event.type) ?? 0) + 1);
        return counts;
    }, [events]);

    const filtered = useMemo(() => {
        return events.filter((extEvent) => {
            const { event } = extEvent;

            if (activeTypes.size && !activeTypes.has(event.type)) return false;

            if (activeFilterTab !== 'all') {
                const rulesForTab =
                    activeFilterTab === 'Pinned'
                        ? rules.filter((r) => r.actions.some((a) => a.type === 'pin'))
                        : rules.filter((r) => r.filterTab?.enabled && r.filterTab.name === activeFilterTab);
                if (!rulesForTab.some((r) => extEvent.matchedRuleIds.includes(r.id))) return false;
            }

            if (filters.urlContains && isRequestEvent(event) && !event.data.request.url.toLowerCase().includes(filters.urlContains.toLowerCase())) return false;

            if (filters.status !== 'all' && isRequestEvent(event)) {
                const code = Number(event.data.response.status);
                const isNumeric = !Number.isNaN(code);
                if (filters.status === 'failed' && isNumeric && code < 400) return false;
                if (filters.status === '2xx' && (!isNumeric || code < 200 || code >= 300)) return false;
                if (filters.status === '4xx' && (!isNumeric || code < 400 || code >= 500)) return false;
                if (filters.status === '5xx' && (!isNumeric || code < 500)) return false;
            }

            if (filters.label && event.type === ERilogEvent.DEBUG_MESSAGE) {
                const label = (event.data as any).label ?? '';
                if (!String(label).toLowerCase().includes(filters.label.toLowerCase())) return false;
            }

            if (filters.search) {
                const haystack = JSON.stringify(event.data).toLowerCase();
                if (!haystack.includes(filters.search.toLowerCase())) return false;
            }

            return true;
        });
    }, [events, activeTypes, activeFilterTab, filters, rules]);

    const selected = events.find((e) => e.id === selectedId) ?? null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            <Header
                total={events.length}
                filteredCount={filtered.length}
                onClear={onClear}
                onExport={onExport}
                onImportFile={onImportFile}
                theme={<ThemeToggle theme={theme} onToggle={toggleTheme} />}
                view={view}
                onViewChange={setView}
            />

            {/* All three views stay mounted and are only shown/hidden via CSS — switching tabs
                must not lose an in-progress rule edit or settings draft, the same way real
                browser tabs don't reset their page just because you looked at another one. */}
            <div style={{ display: view === 'events' ? 'flex' : 'none', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                <TypeFilterChips counts={typeCounts} active={activeTypes} onToggle={setActiveTypes} tabs={filterTabNames} activeTab={activeFilterTab} onTabChange={setActiveFilterTab} />
                <FilterBar value={filters} onChange={setFilters} />
                <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: dock === 'right' ? 'row' : 'column' }}>
                    <EventTable events={filtered} selectedId={selectedId} onSelect={setSelectedId} autoScroll={settings.autoScroll} />
                    {selected && <DetailPanel extEvent={selected} tabId={tabId} onClose={() => setSelectedId(null)} rules={rules} dock={dock} onDockChange={setDock} />}
                </div>
            </div>

            <div style={{ display: view === 'rules' ? 'flex' : 'none', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                <RulesView onRulesChanged={setRules} />
            </div>

            <div style={{ display: view === 'settings' ? 'flex' : 'none', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                <SettingsView settings={settings} onSaved={setSettings} />
            </div>

            <Toasts toasts={toasts} onDismiss={dismissToast} onOpen={openEvent} />
        </div>
    );
}
