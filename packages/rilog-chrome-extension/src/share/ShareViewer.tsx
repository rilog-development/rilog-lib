import { ReactNode, useEffect, useState } from 'react';
import { ERilogEvent, IRilogEventItem, IRilogRequestItem } from '@rilog-development/rilog-shared';
import { getSharedEvent } from '../background/share/LocalShareAdapter';
import { CodeBlock } from '../ui/CodeBlock';
import { EventTypeBadge } from '../ui/EventTypeBadge';
import { formatTime, statusColorVar } from '../ui/eventFormat';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useTheme } from '../ui/useTheme';

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--text-faint)', marginBottom: 8 }}>{title}</div>
            {children}
        </div>
    );
}

export function ShareViewer() {
    const [theme, toggleTheme] = useTheme();
    const [event, setEvent] = useState<IRilogEventItem | null | undefined>(undefined);

    useEffect(() => {
        const id = location.hash.slice(1);
        if (!id) {
            setEvent(null);
            return;
        }
        getSharedEvent(id).then((e) => setEvent(e ?? null));
    }, []);

    if (event === undefined) return <div style={{ padding: 24, color: 'var(--text-muted)' }}>Loading…</div>;

    if (event === null) {
        return (
            <div style={{ padding: 24, color: 'var(--text-muted)', maxWidth: 480, margin: '40px auto', textAlign: 'center' }}>
                This shared event was not found — links only resolve in the browser profile that shared them (local storage, no backend yet).
            </div>
        );
    }

    const isRequest = event.type === ERilogEvent.REQUEST;
    const requestItem = isRequest ? (event.data as IRilogRequestItem) : null;

    return (
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <EventTypeBadge type={event.type} />
                <span style={{ color: 'var(--text-faint)', fontSize: 12 }}>{formatTime(event.date)}</span>
                <div style={{ flex: 1 }} />
                <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </div>

            {isRequest && requestItem ? (
                <>
                    <Section title="Request">
                        <div style={{ marginBottom: 8 }}>
                            <b>{requestItem.request.method}</b> {requestItem.request.url}
                        </div>
                        <CodeBlock value={requestItem.request.headers} maxHeight={140} />
                        <div style={{ height: 8 }} />
                        <CodeBlock value={requestItem.request.data} />
                    </Section>
                    <Section title="Response">
                        <div style={{ marginBottom: 8, color: statusColorVar(requestItem.response.status), fontWeight: 700 }}>{requestItem.response.status}</div>
                        <CodeBlock value={requestItem.response.data} />
                    </Section>
                </>
            ) : (
                <Section title="Data">
                    <CodeBlock value={event.data} maxHeight={400} />
                </Section>
            )}

            <Section title="Location">
                <div style={{ fontSize: 12.5 }}>{event.location.href ?? '—'}</div>
            </Section>
        </div>
    );
}
