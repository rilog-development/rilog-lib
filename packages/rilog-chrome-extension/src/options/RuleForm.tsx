import { CSSProperties, ReactNode, useState } from 'react';
import { ERilogEvent } from '@rilog-development/rilog-shared';
import { IRilogRule, TRilogRuleAction } from '../types/rules';
import { EVENT_TYPE_LABEL } from '../ui/eventFormat';

const ALL_TYPES = [ERilogEvent.REQUEST, ERilogEvent.CLICK, ERilogEvent.INPUT, ERilogEvent.CONSOLE_WARN, ERilogEvent.CONSOLE_ERROR, ERilogEvent.DEBUG_MESSAGE];

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

export function RuleForm({ rule, onSave, onCancel }: { rule: IRilogRule; onSave: (r: IRilogRule) => void; onCancel: () => void }) {
    const [draft, setDraft] = useState<IRilogRule>(rule);

    const toggleType = (type: ERilogEvent) => {
        setDraft((d) => ({ ...d, eventTypes: d.eventTypes.includes(type) ? d.eventTypes.filter((t) => t !== type) : [...d.eventTypes, type] }));
    };

    const addAction = (action: TRilogRuleAction) => setDraft((d) => ({ ...d, actions: [...d.actions, action] }));
    const removeAction = (idx: number) => setDraft((d) => ({ ...d, actions: d.actions.filter((_, i) => i !== idx) }));

    return (
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 16, background: 'var(--surface)' }}>
            <Field label="Name">
                <input style={inputStyle} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Payment errors" />
            </Field>

            <Field label="Enabled">
                <input type="checkbox" checked={draft.enabled} onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} />
            </Field>

            <Field label="Event types (empty = any)">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {ALL_TYPES.map((type) => (
                        <label key={type} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                            <input type="checkbox" checked={draft.eventTypes.includes(type)} onChange={() => toggleType(type)} />
                            {EVENT_TYPE_LABEL[type]}
                        </label>
                    ))}
                </div>
            </Field>

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

            <Field label="Status range">
                <div style={{ display: 'flex', gap: 8 }}>
                    <input
                        style={inputStyle}
                        type="number"
                        placeholder="min"
                        value={draft.match.status?.min ?? ''}
                        onChange={(e) => setDraft({ ...draft, match: { ...draft.match, status: { ...draft.match.status, min: e.target.value ? Number(e.target.value) : undefined } } })}
                    />
                    <input
                        style={inputStyle}
                        type="number"
                        placeholder="max"
                        value={draft.match.status?.max ?? ''}
                        onChange={(e) => setDraft({ ...draft, match: { ...draft.match, status: { ...draft.match.status, max: e.target.value ? Number(e.target.value) : undefined } } })}
                    />
                </div>
            </Field>

            <Field label="Body path (dot notation, e.g. data.customType)">
                <input style={inputStyle} value={draft.match.bodyPath ?? ''} onChange={(e) => setDraft({ ...draft, match: { ...draft.match, bodyPath: e.target.value || undefined } })} />
            </Field>

            <Field label="Body value (JSON — presence-only check if left empty)">
                <input
                    style={inputStyle}
                    defaultValue={draft.match.bodyValue !== undefined ? JSON.stringify(draft.match.bodyValue) : ''}
                    onChange={(e) => {
                        const raw = e.target.value;
                        if (!raw) {
                            setDraft((d) => ({ ...d, match: { ...d.match, bodyValue: undefined } }));
                            return;
                        }
                        try {
                            setDraft((d) => ({ ...d, match: { ...d.match, bodyValue: JSON.parse(raw) } }));
                        } catch {
                            // ignore invalid JSON while typing
                        }
                    }}
                    placeholder='"simple"'
                />
            </Field>

            <Field label="Click selector (#id, .class, or tag name)">
                <input style={inputStyle} value={draft.match.clickSelector ?? ''} onChange={(e) => setDraft({ ...draft, match: { ...draft.match, clickSelector: e.target.value || undefined } })} />
            </Field>

            <Field label="Actions">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {draft.actions.map((action, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                            <span className="rilog-badge" style={{ color: 'var(--accent)', background: 'var(--surface-2)' }}>
                                {action.type}
                            </span>
                            {action.type === 'notify' && <span style={{ color: 'var(--text-muted)' }}>{action.title}</span>}
                            {action.type === 'openFilterTab' && <span style={{ color: 'var(--text-muted)' }}>{action.filterName}</span>}
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
                        <button className="rilog-icon-btn" style={{ width: 'auto', padding: '4px 10px' }} onClick={() => addAction({ type: 'openFilterTab', filterName: draft.name || 'tab' })}>
                            + Filter tab
                        </button>
                        <button className="rilog-icon-btn" style={{ width: 'auto', padding: '4px 10px' }} onClick={() => addAction({ type: 'console' })}>
                            + Console log
                        </button>
                    </div>
                </div>
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
