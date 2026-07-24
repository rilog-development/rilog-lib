import { ReactNode, useRef } from 'react';
import { GearIcon } from '../../../ui/GearIcon';
import { TPanelView } from '../App';

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
    return (
        <button
            onClick={onClick}
            style={{
                background: active ? 'var(--accent)' : 'transparent',
                color: active ? 'var(--accent-contrast)' : 'var(--text-muted)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '5px 12px',
                fontSize: 12,
                fontWeight: 600,
            }}
        >
            {children}
        </button>
    );
}

const plainButtonStyle: React.CSSProperties = {
    background: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--text-muted)',
    borderRadius: 'var(--radius-sm)',
    padding: '4px 10px',
    fontSize: 12,
};

export function Header({
    total,
    filteredCount,
    onClear,
    onExport,
    onImportFile,
    theme,
    view,
    onViewChange,
}: {
    total: number;
    filteredCount: number;
    onClear: () => void;
    onExport: () => void;
    onImportFile: (file: File) => void;
    theme: ReactNode;
    view: TPanelView;
    onViewChange: (view: TPanelView) => void;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '10px 14px',
                background: 'var(--surface)',
                borderBottom: '1px solid var(--border)',
                flexShrink: 0,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, letterSpacing: 0.2 }}>
                <span
                    style={{
                        display: 'inline-flex',
                        width: 20,
                        height: 20,
                        borderRadius: 5,
                        background: 'var(--accent)',
                        color: 'var(--accent-contrast)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                    }}
                >
                    R
                </span>
                Rilog
            </div>

            <div style={{ display: 'flex', gap: 4, background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: 2 }}>
                <TabButton active={view === 'events'} onClick={() => onViewChange('events')}>
                    Events
                </TabButton>
                <TabButton active={view === 'rules'} onClick={() => onViewChange('rules')}>
                    Rules
                </TabButton>
            </div>

            {view === 'events' && <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{filteredCount === total ? `${total} events` : `${filteredCount} / ${total} events`}</div>}

            <div style={{ flex: 1 }} />

            {view === 'events' && (
                <>
                    <button onClick={onExport} title="Download all captured events as a JSON file" style={plainButtonStyle}>
                        Export
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} title="Load events from a previously exported JSON file" style={plainButtonStyle}>
                        Import
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/json"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) onImportFile(file);
                            e.target.value = '';
                        }}
                    />
                    <button onClick={onClear} style={plainButtonStyle}>
                        Clear
                    </button>
                </>
            )}

            <button
                onClick={() => onViewChange('settings')}
                title="Settings"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: view === 'settings' ? 'var(--accent)' : 'transparent',
                    border: view === 'settings' ? 'none' : '1px solid var(--border)',
                    color: view === 'settings' ? 'var(--accent-contrast)' : 'var(--text-muted)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '4px 10px',
                    fontSize: 12,
                    fontWeight: 600,
                }}
            >
                <GearIcon />
                Settings
            </button>

            {theme}
        </div>
    );
}
