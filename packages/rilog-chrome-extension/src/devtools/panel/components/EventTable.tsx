import { IExtensionEvent } from '../../../types/messages';
import { EventTypeBadge } from '../../../ui/EventTypeBadge';
import { formatTime, isRequestEvent, statusColorVar, summarizeEvent } from '../../../ui/eventFormat';

export function EventTable({ events, selectedId, onSelect }: { events: IExtensionEvent[]; selectedId: string | null; onSelect: (id: string) => void }) {
    if (!events.length) {
        return (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)', fontSize: 13 }}>
                No events yet — interact with the page to see requests, clicks, inputs, and console output here.
            </div>
        );
    }

    return (
        <div style={{ flex: 1, overflow: 'auto' }}>
            {events.map((extEvent) => {
                const { primary, secondary, status } = summarizeEvent(extEvent.event);
                const isSelected = extEvent.id === selectedId;
                const isRequest = isRequestEvent(extEvent.event);

                return (
                    <div
                        key={extEvent.id}
                        onClick={() => onSelect(extEvent.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '6px 14px',
                            borderBottom: '1px solid var(--border)',
                            background: isSelected ? 'var(--row-selected)' : 'transparent',
                            cursor: 'pointer',
                            fontSize: 12.5,
                        }}
                        onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'var(--row-hover)';
                        }}
                        onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'transparent';
                        }}
                    >
                        <span
                            title={extEvent.source === 'bridge' ? 'From rilog-lib onPushEvent bridge' : 'Captured by extension'}
                            style={{ width: 6, height: 6, borderRadius: '50%', background: extEvent.source === 'bridge' ? 'var(--accent)' : 'var(--text-faint)', flexShrink: 0 }}
                        />
                        <EventTypeBadge type={extEvent.event.type} />
                        <span style={{ color: 'var(--text-faint)', width: 78, flexShrink: 0 }}>{formatTime(extEvent.event.date).split(', ')[1] ?? formatTime(extEvent.event.date)}</span>
                        {isRequest && (
                            <span style={{ color: 'var(--text-muted)', width: 46, flexShrink: 0, fontWeight: 600 }}>{primary}</span>
                        )}
                        <span style={{ color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{isRequest ? secondary : primary}</span>
                        {!isRequest && secondary && <span style={{ color: 'var(--text-faint)', flexShrink: 0, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{secondary}</span>}
                        {status !== undefined && status !== null && (
                            <span style={{ color: statusColorVar(status), fontWeight: 700, width: 34, textAlign: 'right', flexShrink: 0 }}>{status}</span>
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
