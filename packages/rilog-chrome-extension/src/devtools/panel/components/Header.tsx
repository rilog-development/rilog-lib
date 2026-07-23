import { ReactNode } from 'react';

export function Header({ total, filteredCount, onClear, theme }: { total: number; filteredCount: number; onClear: () => void; theme: ReactNode }) {
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

            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                {filteredCount === total ? `${total} events` : `${filteredCount} / ${total} events`}
            </div>

            <div style={{ flex: 1 }} />

            <button
                onClick={onClear}
                style={{
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    color: 'var(--text-muted)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '4px 10px',
                    fontSize: 12,
                }}
            >
                Clear
            </button>

            {theme}
        </div>
    );
}
