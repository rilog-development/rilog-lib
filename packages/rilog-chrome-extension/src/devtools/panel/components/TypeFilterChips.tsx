import { ERilogEvent } from '@rilog-development/rilog-shared';
import { EVENT_TYPE_BADGE, typeColorVar } from '../../../ui/eventFormat';

const ALL_TYPES = [ERilogEvent.REQUEST, ERilogEvent.CLICK, ERilogEvent.INPUT, ERilogEvent.CONSOLE_WARN, ERilogEvent.CONSOLE_ERROR, ERilogEvent.DEBUG_MESSAGE];

export function TypeFilterChips({
    counts,
    active,
    onToggle,
    tabs,
    activeTab,
    onTabChange,
}: {
    counts: Map<ERilogEvent, number>;
    active: Set<ERilogEvent>;
    onToggle: (next: Set<ERilogEvent>) => void;
    tabs: string[];
    activeTab: string;
    onTabChange: (tab: string) => void;
}) {
    const toggleType = (type: ERilogEvent) => {
        const next = new Set(active);
        if (next.has(type)) next.delete(type);
        else next.add(type);
        onToggle(next);
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 14px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', flexShrink: 0, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--text-faint)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4, marginRight: 2 }}>Filter:</span>
                {ALL_TYPES.filter((t) => counts.has(t)).map((type) => {
                    const { fg, bg } = typeColorVar(type);
                    const isActive = active.has(type);
                    return (
                        <button
                            key={type}
                            onClick={() => toggleType(type)}
                            className="rilog-badge"
                            style={{
                                color: fg,
                                background: isActive ? bg : 'transparent',
                                border: `1px solid ${isActive ? fg : 'var(--border)'}`,
                                opacity: active.size && !isActive ? 0.55 : 1,
                            }}
                        >
                            {EVENT_TYPE_BADGE[type]} {counts.get(type)}
                        </button>
                    );
                })}
            </div>

            {tabs.length > 0 && (
                <>
                    <div style={{ width: 1, height: 18, background: 'var(--border)' }} />
                    <div style={{ display: 'flex', gap: 4 }}>
                        <button
                            onClick={() => onTabChange('all')}
                            style={{
                                background: activeTab === 'all' ? 'var(--accent)' : 'transparent',
                                color: activeTab === 'all' ? 'var(--accent-contrast)' : 'var(--text-muted)',
                                border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                padding: '4px 10px',
                                fontSize: 12,
                                fontWeight: 600,
                            }}
                        >
                            All
                        </button>
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => onTabChange(tab)}
                                style={{
                                    background: activeTab === tab ? 'var(--accent)' : 'transparent',
                                    color: activeTab === tab ? 'var(--accent-contrast)' : 'var(--text-muted)',
                                    border: 'none',
                                    borderRadius: 'var(--radius-sm)',
                                    padding: '4px 10px',
                                    fontSize: 12,
                                    fontWeight: 600,
                                }}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
