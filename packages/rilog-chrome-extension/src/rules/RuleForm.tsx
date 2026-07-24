import { CSSProperties, ReactNode, useState } from 'react';
import { ERilogEvent } from '@rilog-development/rilog-shared';
import { IRilogRule, TRilogBodyOperator, TRilogRuleAction } from '../types/rules';
import { EVENT_TYPE_LABEL } from '../ui/eventFormat';

const ALL_TYPES = [ERilogEvent.REQUEST, ERilogEvent.CLICK, ERilogEvent.INPUT, ERilogEvent.CONSOLE_WARN, ERilogEvent.CONSOLE_ERROR, ERilogEvent.DEBUG_MESSAGE];

const BODY_OPERATOR_LABEL: Record<TRilogBodyOperator, string> = {
    exists: 'Exists (any value, including null)',
    equals: 'Equals',
    notEquals: 'Not equals',
    contains: 'Contains',
};

const inputStyle: CSSProperties = {
    width: '100%',
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text)',
    padding: '6px 9px',
    fontSize: 12.5,
    outline: 'none',
};

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</div>
            {children}
        </div>
    );
}

function SectionTitle({ children }: { children: ReactNode }) {
    return <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 10, marginTop: 4 }}>{children}</div>;
}

export function RuleForm({ rule, onSave, onCancel }: { rule: IRilogRule; onSave: (r: IRilogRule) => void; onCancel: () => void }) {
    const [draft, setDraft] = useState<IRilogRule>(rule);

    const addAction = (action: TRilogRuleAction) => setDraft((d) => ({ ...d, actions: [...d.actions, action] }));
    const removeAction = (idx: number) => setDraft((d) => ({ ...d, actions: d.actions.filter((_, i) => i !== idx) }));

    const onTypeChange = (eventType: ERilogEvent) => {
        // switching type invalidates fields that only made sense for the old one
        setDraft((d) => ({ ...d, eventType, match: {} }));
    };

    const isRequest = draft.eventType === ERilogEvent.REQUEST;
    const isClick = draft.eventType === ERilogEvent.CLICK;

    return (
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 16, background: 'var(--surface)' }}>
            <Field label="Name">
                <input style={inputStyle} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Payment errors" />
            </Field>

            <Field label="Enabled">
                <input type="checkbox" checked={draft.enabled} onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} />
            </Field>

            <Field label="Event type">
                <select style={inputStyle} value={draft.eventType} onChange={(e) => onTypeChange(Number(e.target.value) as ERilogEvent)}>
                    {ALL_TYPES.map((type) => (
                        <option key={type} value={type}>
                            {EVENT_TYPE_LABEL[type]}
                        </option>
                    ))}
                </select>
            </Field>

            <SectionTitle>Match</SectionTitle>

            {isRequest && (
                <>
                    <Field label="URL pattern (regex or substring)">
                        <input style={inputStyle} value={draft.match.urlPattern ?? ''} onChange={(e) => setDraft({ ...draft, match: { ...draft.match, urlPattern: e.target.value || undefined } })} placeholder="/api/orders" />
                    </Field>

                    <Field label="Methods (comma-separated)">
                        <input
                            style={inputStyle}
                            value={draft.match.method?.join(', ') ?? ''}
                            onChange={(e) =>
                                setDraft({
                                    ...draft,
                                    match: { ...draft.match, method: e.target.value ? e.target.value.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean) : undefined },
                                })
                            }
                            placeholder="POST, PUT"
                        />
                    </Field>

                    <Field label="Status">
                        <input
                            style={inputStyle}
                            list="rilog-status-suggestions"
                            placeholder="e.g. 503 or 5**"
                            value={draft.match.status ?? ''}
                            onChange={(e) => setDraft({ ...draft, match: { ...draft.match, status: e.target.value || undefined } })}
                        />
                        <datalist id="rilog-status-suggestions">
                            <option value="2**" />
                            <option value="3**" />
                            <option value="4**" />
                            <option value="5**" />
                        </datalist>
                    </Field>
                </>
            )}

            {isClick && (
                <Field label="Click selector (#id, .class, or tag name)">
                    <input style={inputStyle} value={draft.match.clickSelector ?? ''} onChange={(e) => setDraft({ ...draft, match: { ...draft.match, clickSelector: e.target.value || undefined } })} placeholder="#save-btn" />
                </Field>
            )}

            <Field label={isRequest ? 'Body path (checked in request + response)' : 'Data path (into this event’s data)'}>
                <input style={inputStyle} value={draft.match.bodyPath ?? ''} onChange={(e) => setDraft({ ...draft, match: { ...draft.match, bodyPath: e.target.value || undefined } })} placeholder="userId, content[0].isFavorite" />
                <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>
                    Plain key (<code>userId</code>), a specific array index (<code>content[0].x</code>), or <code>content[].x</code> to match if ANY item satisfies it. Leave empty to skip body
                    matching entirely.
                </div>
            </Field>

            {draft.match.bodyPath && (
                <Field label="Condition">
                    <div style={{ display: 'flex', gap: 8 }}>
                        <select
                            style={{ ...inputStyle, flex: 1 }}
                            value={draft.match.bodyOperator ?? 'exists'}
                            onChange={(e) => setDraft({ ...draft, match: { ...draft.match, bodyOperator: e.target.value as TRilogBodyOperator } })}
                        >
                            {(Object.keys(BODY_OPERATOR_LABEL) as TRilogBodyOperator[]).map((op) => (
                                <option key={op} value={op}>
                                    {BODY_OPERATOR_LABEL[op]}
                                </option>
                            ))}
                        </select>
                        {draft.match.bodyOperator && draft.match.bodyOperator !== 'exists' && (
                            <input
                                style={{ ...inputStyle, flex: 1 }}
                                value={draft.match.bodyValue ?? ''}
                                onChange={(e) => setDraft({ ...draft, match: { ...draft.match, bodyValue: e.target.value } })}
                                placeholder="null, true, 404, or plain text"
                            />
                        )}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>
                        Type values plainly — no quotes needed. <code>null</code>, <code>true</code>/<code>false</code>, and numbers are recognized automatically; anything else is compared as
                        text.
                    </div>
                </Field>
            )}

            <SectionTitle>Actions</SectionTitle>

            <Field label="On match">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {draft.actions.map((action, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                            <span
                                className="rilog-badge"
                                style={action.type === 'ignore' ? { color: 'var(--type-console-error)', background: 'var(--type-console-error-bg)' } : { color: 'var(--accent)', background: 'var(--surface-2)' }}
                            >
                                {action.type}
                            </span>
                            {action.type === 'notify' && <span style={{ color: 'var(--text-muted)' }}>{action.title}</span>}
                            <button onClick={() => removeAction(idx)} className="rilog-icon-btn" style={{ width: 'auto', padding: '2px 8px', marginLeft: 'auto' }}>
                                Remove
                            </button>
                        </div>
                    ))}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button className="rilog-icon-btn" style={{ width: 'auto', padding: '4px 10px' }} onClick={() => addAction({ type: 'notify', title: draft.name || 'Rilog rule matched' })}>
                            + Notify
                        </button>
                        <button className="rilog-icon-btn" style={{ width: 'auto', padding: '4px 10px' }} onClick={() => addAction({ type: 'pin' })}>
                            + Pin
                        </button>
                        <button className="rilog-icon-btn" style={{ width: 'auto', padding: '4px 10px' }} onClick={() => addAction({ type: 'console' })}>
                            + Console log
                        </button>
                        <button
                            className="rilog-icon-btn"
                            style={{ width: 'auto', padding: '4px 10px', color: 'var(--type-console-error)' }}
                            onClick={() => addAction({ type: 'ignore' })}
                            title="Don't capture matching events at all"
                        >
                            + Ignore
                        </button>
                    </div>
                </div>
            </Field>

            <Field label="Filter tab in Events">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, marginBottom: draft.filterTab.enabled ? 8 : 0 }}>
                    <input type="checkbox" checked={draft.filterTab.enabled} onChange={(e) => setDraft({ ...draft, filterTab: { ...draft.filterTab, enabled: e.target.checked } })} />
                    Show matching events under a named filter tab in the Events view
                </label>
                {draft.filterTab.enabled && (
                    <input
                        style={inputStyle}
                        value={draft.filterTab.name}
                        onChange={(e) => setDraft({ ...draft, filterTab: { ...draft.filterTab, name: e.target.value } })}
                        placeholder="e.g. Payments"
                    />
                )}
            </Field>

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button onClick={() => onSave(draft)} style={{ background: 'var(--accent)', color: 'var(--accent-contrast)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '8px 14px', fontWeight: 600 }}>
                    Save
                </button>
                <button onClick={onCancel} className="rilog-icon-btn" style={{ width: 'auto', padding: '8px 14px' }}>
                    Cancel
                </button>
            </div>
        </div>
    );
}
