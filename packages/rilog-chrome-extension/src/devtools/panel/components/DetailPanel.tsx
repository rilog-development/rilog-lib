import { useState } from 'react';
import { ERilogEvent, IRilogRequestItem } from '@rilog-development/rilog-shared';
import { IExtensionEvent, TRuntimeResponse } from '../../../types/messages';
import { IRilogRule } from '../../../types/rules';
import { EventTypeBadge } from '../../../ui/EventTypeBadge';
import { CodeBlock } from '../../../ui/CodeBlock';
import { formatTime, statusColorVar } from '../../../ui/eventFormat';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--text-faint)', marginBottom: 6 }}>{title}</div>
            {children}
        </div>
    );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{label}</div>
            <div style={{ fontSize: 12.5 }}>{value}</div>
        </div>
    );
}

export function DetailPanel({ extEvent, tabId, onClose, rules }: { extEvent: IExtensionEvent; tabId: number; onClose: () => void; rules: IRilogRule[] }) {
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [sharing, setSharing] = useState(false);

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

    return (
        <div
            style={{
                width: 420,
                flexShrink: 0,
                borderLeft: '1px solid var(--border)',
                background: 'var(--surface)',
                overflow: 'auto',
                padding: 16,
                boxShadow: 'var(--shadow)',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <EventTypeBadge type={event.type} />
                <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>{formatTime(event.date)}</span>
                <div style={{ flex: 1 }} />
                <button onClick={onShare} disabled={sharing} className="rilog-icon-btn" style={{ width: 'auto', padding: '4px 10px', fontSize: 11, fontWeight: 600 }}>
                    {sharing ? '…' : 'Share'}
                </button>
                <button onClick={onClose} className="rilog-icon-btn" title="Close">
                    ✕
                </button>
            </div>

            {shareUrl && (
                <Section title="Share link">
                    <div style={{ display: 'flex', gap: 6 }}>
                        <input readOnly value={shareUrl} style={{ flex: 1, background: 'var(--code-bg)', border: '1px solid var(--border)', color: 'var(--code-text)', borderRadius: 'var(--radius-sm)', padding: '5px 8px', fontSize: 11 }} />
                        <button className="rilog-icon-btn" style={{ width: 'auto', padding: '4px 10px' }} onClick={() => navigator.clipboard.writeText(shareUrl)}>
                            Copy
                        </button>
                    </div>
                </Section>
            )}

            {isRequest && requestItem ? (
                <>
                    <Section title="Request">
                        <Field label="URL" value={requestItem.request.url} />
                        <Field label="Method" value={requestItem.request.method} />
                        <Field label="Timestamp" value={new Date(requestItem.request.timestamp).toISOString()} />
                        <Field label="Headers" value={<CodeBlock value={requestItem.request.headers} maxHeight={120} />} />
                        <Field label="Body" value={<CodeBlock value={requestItem.request.data} />} />
                    </Section>
                    <Section title="Response">
                        <Field label="Status" value={<span style={{ color: statusColorVar(requestItem.response.status), fontWeight: 700 }}>{requestItem.response.status}</span>} />
                        <Field label="Timestamp" value={new Date(requestItem.response.timestamp).toISOString()} />
                        {requestItem.duration && <Field label="Duration" value={`${requestItem.duration} ms`} />}
                        <Field label="Body" value={<CodeBlock value={requestItem.response.data} />} />
                    </Section>
                </>
            ) : (
                <Section title="Data">
                    <CodeBlock value={event.data} maxHeight={360} />
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
    );
}
