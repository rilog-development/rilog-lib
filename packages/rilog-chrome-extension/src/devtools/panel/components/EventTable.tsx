import { useEffect, useRef } from 'react';
import { IExtensionEvent } from '../../../types/messages';
import { EventTypeBadge } from '../../../ui/EventTypeBadge';
import { formatTimeOnly, isRequestEvent, requestSeverity, statusColorVar, summarizeEvent } from '../../../ui/eventFormat';

export function EventTable({ events, selectedId, onSelect, autoScroll }: { events: IExtensionEvent[]; selectedId: string | null; onSelect: (id: string) => void; autoScroll: boolean }) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!autoScroll) return;
        const el = containerRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [events.length, autoScroll]);

    if (!events.length) {
        return (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)', fontSize: 13 }}>
                No events yet — interact with the page to see requests, clicks, inputs, and console output here.
            </div>
        );
    }

    return (
        <div ref={containerRef} style={{ flex: 1, overflow: 'auto' }}>
            {events.map((extEvent) => {
                const { primary, secondary, status } = summarizeEvent(extEvent.event);
                const isSelected = extEvent.id === selectedId;
                const isRequest = isRequestEvent(extEvent.event);
                const severity = isRequest ? requestSeverity(status) : 'ok';

                // Failed requests (5xx, network errors/timeouts) get a persistent red left border +
                // tint so they're scannable at a glance, not just a small colored status number.
                // 4xx gets the same treatment in amber — a real error, but usually less severe.
                const severityBorder = severity === 'error' ? 'var(--status-5xx)' : severity === 'warn' ? 'var(--status-4xx)' : 'transparent';
                const severityBg = severity === 'error' ? 'var(--type-console-error-bg)' : severity === 'warn' ? 'var(--type-console-warn-bg)' : 'transparent';
                const restingBg = isSelected ? 'var(--row-selected)' : severityBg;

                return (
                    <div
                        key={extEvent.id}
                        onClick={() => onSelect(extEvent.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '6px 14px 6px 11px',
                            borderBottom: '1px solid var(--border)',
                            borderLeft: `3px solid ${severityBorder}`,
                            background: restingBg,
                            cursor: 'pointer',
                            fontSize: 12.5,
                        }}
                        onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.background = severity === 'ok' ? 'var(--row-hover)' : severity === 'error' ? 'rgba(255,92,104,0.22)' : 'rgba(224,166,61,0.22)';
                        }}
                        onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.background = restingBg;
                        }}
                    >
                        <span
                            title={extEvent.source === 'bridge' ? 'From rilog-lib onPushEvent bridge' : 'Captured by extension'}
                            style={{ width: 6, height: 6, borderRadius: '50%', background: extEvent.source === 'bridge' ? 'var(--accent)' : 'var(--text-faint)', flexShrink: 0 }}
                        />
                        <EventTypeBadge type={extEvent.event.type} />
                        <span style={{ color: 'var(--text-faint)', width: 78, flexShrink: 0 }}>{formatTimeOnly(extEvent.event.date)}</span>
                        {isRequest && (
                            <span style={{ color: 'var(--text-muted)', width: 46, flexShrink: 0, fontWeight: 600 }}>{primary}</span>
                        )}
                        <span style={{ color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{isRequest ? secondary : primary}</span>
                        {!isRequest && secondary && <span style={{ color: 'var(--text-faint)', flexShrink: 0, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{secondary}</span>}
                        {status !== undefined && status !== null && (
                            <span style={{ color: statusColorVar(status), fontWeight: 700, minWidth: 34, textAlign: 'right', flexShrink: 0, whiteSpace: 'nowrap' }}>{status}</span>
                        )}
                        {extEvent.matchedRuleIds.length > 0 && (
                            <span title={`Matched ${extEvent.matchedRuleIds.length} rule(s)`} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--type-console-warn)', flexShrink: 0 }} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
