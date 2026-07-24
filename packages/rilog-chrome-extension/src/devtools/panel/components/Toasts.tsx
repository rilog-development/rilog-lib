export interface IToast {
    id: string;
    title: string;
    body?: string;
    extensionEventId: string;
}

export function Toasts({ toasts, onDismiss, onOpen }: { toasts: IToast[]; onDismiss: (id: string) => void; onOpen: (extensionEventId: string) => void }) {
    if (!toasts.length) return null;

    return (
        <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 2000, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 320 }}>
            {toasts.map((t) => (
                <div
                    key={t.id}
                    style={{
                        background: 'var(--surface-raised)',
                        border: '1px solid var(--type-console-warn)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow)',
                        padding: '10px 14px',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => onOpen(t.extensionEventId)}>
                            <div style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--type-console-warn)' }}>{t.title}</div>
                            {t.body && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{t.body}</div>}
                            <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>Click to view event →</div>
                        </div>
                        <button onClick={() => onDismiss(t.id)} className="rilog-icon-btn" title="Dismiss" style={{ flexShrink: 0 }}>
                            ✕
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
