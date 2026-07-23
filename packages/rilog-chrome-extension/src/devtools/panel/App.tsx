import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ERilogEvent } from '@rilog-development/rilog-shared';
import { DEVTOOLS_PORT_PREFIX, IExtensionEvent, TPortMessage, TRuntimeResponse } from '../../types/messages';
import { IRilogRule } from '../../types/rules';
import { useTheme } from '../../ui/useTheme';
import { ThemeToggle } from '../../ui/ThemeToggle';
import { isRequestEvent } from '../../ui/eventFormat';
import { Header } from './components/Header';
import { TypeFilterChips } from './components/TypeFilterChips';
import { FilterBar, IFilterState } from './components/FilterBar';
import { EventTable } from './components/EventTable';
import { DetailPanel } from './components/DetailPanel';

const EMPTY_FILTERS: IFilterState = { search: '', urlContains: '', status: 'all', label: '' };

export function App() {
    const [theme, toggleTheme] = useTheme();
    const tabId = chrome.devtools.inspectedWindow.tabId;

    const [events, setEvents] = useState<IExtensionEvent[]>([]);
    const [rules, setRules] = useState<IRilogRule[]>([]);
    const [activeTypes, setActiveTypes] = useState<Set<ERilogEvent>>(new Set());
    const [filters, setFilters] = useState<IFilterState>(EMPTY_FILTERS);
    const [activeFilterTab, setActiveFilterTab] = useState<string>('all');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const portRef = useRef<chrome.runtime.Port | null>(null);

    useEffect(() => {
        chrome.runtime.sendMessage({ type: 'rilog/get-events', tabId }, (response: TRuntimeResponse) => {
            if (response?.type === 'rilog/events') setEvents(response.events);
        });
        chrome.runtime.sendMessage({ type: 'rilog/get-rules' }, (response: TRuntimeResponse) => {
            if (response?.type === 'rilog/rules') setRules(response.rules);
        });

        const port = chrome.runtime.connect({ name: `${DEVTOOLS_PORT_PREFIX}:${tabId}` });
        portRef.current = port;

        port.onMessage.addListener((message: TPortMessage) => {
            if (message.type === 'rilog/event-added') {
                setEvents((prev) => [...prev, message.event]);
            } else if (message.type === 'rilog/event-updated') {
                setEvents((prev) => prev.map((e) => (e.id === message.event.id ? message.event : e)));
            } else if (message.type === 'rilog/events-cleared') {
                setEvents([]);
                setSelectedId(null);
            }
        });

        return () => port.disconnect();
    }, [tabId]);

    const onClear = useCallback(() => {
        chrome.runtime.sendMessage({ type: 'rilog/clear-events', tabId });
    }, [tabId]);

    const filterTabNames = useMemo(() => {
        const names = new Set<string>();
        for (const rule of rules) {
            for (const action of rule.actions) {
                if (action.type === 'openFilterTab') names.add(action.filterName);
            }
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
                const rulesForTab = rules.filter((r) => r.actions.some((a) => a.type === 'openFilterTab' && a.filterName === activeFilterTab));
                if (!rulesForTab.some((r) => extEvent.matchedRuleIds.includes(r.id))) return false;
            }

            if (filters.urlContains && isRequestEvent(event) && !event.data.request.url.toLowerCase().includes(filters.urlContains.toLowerCase())) return false;

            if (filters.status !== 'all' && isRequestEvent(event)) {
                const code = Number(event.data.response.status);
                const bucket = Number.isNaN(code) ? 'other' : code >= 500 ? '5xx' : code >= 400 ? '4xx' : code >= 200 ? '2xx' : 'other';
                if (bucket !== filters.status) return false;
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
            <Header total={events.length} filteredCount={filtered.length} onClear={onClear} theme={<ThemeToggle theme={theme} onToggle={toggleTheme} />} />
            <TypeFilterChips counts={typeCounts} active={activeTypes} onToggle={setActiveTypes} tabs={filterTabNames} activeTab={activeFilterTab} onTabChange={setActiveFilterTab} />
            <FilterBar value={filters} onChange={setFilters} />
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex' }}>
                <EventTable events={filtered} selectedId={selectedId} onSelect={setSelectedId} />
                {selected && <DetailPanel extEvent={selected} tabId={tabId} onClose={() => setSelectedId(null)} rules={rules} />}
            </div>
        </div>
    );
}
