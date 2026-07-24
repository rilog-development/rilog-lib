import { ReactNode, useState } from 'react';
import { ERilogEvent, IRilogRequestItem } from '@rilog-development/rilog-shared';
import { IExtensionEvent, TRuntimeResponse } from '../../../types/messages';
import { IRilogRule } from '../../../types/rules';
import { CodeBlock } from '../../../ui/CodeBlock';
import { DockIcon } from '../../../ui/DockIcon';
import { EventTypeBadge } from '../../../ui/EventTypeBadge';
import { formatTime, statusColorVar } from '../../../ui/eventFormat';
import { TDock } from '../../../ui/usePanelDock';
import { usePersistedResizable } from '../../../ui/usePersistedResizable';

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--text-faint)', marginBottom: 6 }}>{title}</div>
            {children}
        </div>
    );
}

function Field({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{label}</div>
            <div style={{ fontSize: 12.5 }}>{value}</div>
        </div>
    );
}

export function DetailPanel({
    extEvent,
    tabId,
    onClose,
    rules,
    dock,
    onDockChange,
}: {
    extEvent: IExtensionEvent;
    tabId: number;
    onClose: () => void;
    rules: IRilogRule[];
    dock: TDock;
    onDockChange: (dock: TDock) => void;
}) {
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [sharing, setSharing] = useState(false);

    // Deliberately not capped near half the window — some bodies are big enough that people want
    // the panel almost full-width, and the table just needs a sliver left to click other rows.
    const width = usePersistedResizable('rilog_panel_width', 460, 320, Math.max(480, window.innerWidth - 220), 'x');
    const height = usePersistedResizable('rilog_panel_height', 380, 220, Math.max(300, window.innerHeight - 160), 'y');
    const isRight = dock === 'right';
    const activeResize = isRight ? width : height;

    const { event } = extEvent;
    const isRequest = event.type === ERilogEvent.REQUEST;
    const requestItem = isRequest ? (event.data as IRilogRequestItem) : null;
    const matchedRules = rules.filter((r) => extEvent.matchedRuleIds.includes(r.id));

    const onShare = () => {
        setSharing(true);
        chrome.runtime.sendMessage({ type: 'rilog/share-event', tabId, extensionEventId: extEvent.id }, (response: TRuntimeResponse) => {
            setSharing(false);
            if (response?.type === 'rilog/share-result') setShareUrl(response.url);
        });
    };

    // Docked to the bottom means the panel spans the full table width, so Request/Response
    // get a two-column layout instead of stacking — the whole point is more room for large bodies.
    const sideBySide = dock === 'bottom';

    return (
        <div
            style={{
                width: isRight ? activeResize.size : '100%',
                height: isRight ? '100%' : activeResize.size,
                flexShrink: 0,
                borderLeft: isRight ? '1px solid var(--border)' : undefined,
                borderTop: isRight ? undefined : '1px solid var(--border)',
                background: 'var(--surface)',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 'var(--shadow)',
                position: 'relative',
            }}
        >
            <div {...activeResize.handleProps} title="Drag to resize" className={`rilog-resize-handle ${isRight ? 'col' : 'row'}`}>
                <div className="rilog-resize-grip" />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                <EventTypeBadge type={event.type} />
                <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>{formatTime(event.date)}</span>
                <div style={{ flex: 1 }} />
                <button onClick={onShare} disabled={sharing} className="rilog-icon-btn" style={{ width: 'auto', padding: '4px 10px', fontSize: 11, fontWeight: 600 }}>
                    {sharing ? '…' : 'Share'}
                </button>
                <button onClick={() => onDockChange('bottom')} className="rilog-icon-btn" title="Dock to bottom" style={{ color: dock === 'bottom' ? 'var(--accent)' : undefined }}>
                    <DockIcon position="bottom" />
                </button>
                <button onClick={() => onDockChange('right')} className="rilog-icon-btn" title="Dock to right" style={{ color: dock === 'right' ? 'var(--accent)' : undefined }}>
                    <DockIcon position="right" />
                </button>
                <button onClick={onClose} className="rilog-icon-btn" title="Close">
                    ✕
                </button>
            </div>

            <div style={{ overflow: 'auto', padding: 16, flex: 1 }}>
                {shareUrl && (
                    <Section title="Share link">
                        <div style={{ display: 'flex', gap: 6 }}>
                            <input
                                readOnly
                                value={shareUrl}
                                style={{ flex: 1, background: 'var(--code-bg)', border: '1px solid var(--border)', color: 'var(--code-text)', borderRadius: 'var(--radius-sm)', padding: '5px 8px', fontSize: 11 }}
                            />
                            <button className="rilog-icon-btn" style={{ width: 'auto', padding: '4px 10px' }} onClick={() => navigator.clipboard.writeText(shareUrl)}>
                                Copy
                            </button>
                        </div>
                    </Section>
                )}

                {isRequest && requestItem ? (
                    <div style={sideBySide ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 } : undefined}>
                        <Section title="Request">
                            <Field label="URL" value={requestItem.request.url} />
                            <Field label="Method" value={requestItem.request.method} />
                            <Field label="Timestamp" value={new Date(requestItem.request.timestamp).toISOString()} />
                            <Field label="Headers" value={<CodeBlock value={requestItem.request.headers} maxHeight={sideBySide ? 160 : 120} />} />
                            <Field label="Body" value={<CodeBlock value={requestItem.request.data} maxHeight={sideBySide ? 320 : 220} />} />
                        </Section>
                        <Section title="Response">
                            <Field label="Status" value={<span style={{ color: statusColorVar(requestItem.response.status), fontWeight: 700 }}>{requestItem.response.status}</span>} />
                            <Field label="Timestamp" value={new Date(requestItem.response.timestamp).toISOString()} />
                            {requestItem.duration && <Field label="Duration" value={`${requestItem.duration} ms`} />}
                            <Field label="Body" value={<CodeBlock value={requestItem.response.data} maxHeight={sideBySide ? 320 : 220} />} />
                        </Section>
                    </div>
                ) : (
                    <Section title="Data">
                        <CodeBlock value={event.data} maxHeight={sideBySide ? 400 : 360} />
                    </Section>
                )}

                <Section title="Location">
                    <Field label="Origin" value={event.location.origin ?? '—'} />
                    <Field label="Href" value={event.location.href ?? '—'} />
                </Section>

                {matchedRules.length > 0 && (
                    <Section title="Matched rules">
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {matchedRules.map((r) => (
                                <span key={r.id} className="rilog-badge" style={{ color: 'var(--type-console-warn)', background: 'var(--type-console-warn-bg)' }}>
                                    {r.name || r.id}
                                </span>
                            ))}
                        </div>
                    </Section>
                )}
            </div>
        </div>
    );
}
