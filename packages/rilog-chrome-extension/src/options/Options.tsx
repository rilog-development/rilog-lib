import { CSSProperties, useEffect, useState } from 'react';
import { TRuntimeResponse } from '../types/messages';
import { createEmptyRule, IRilogRule } from '../types/rules';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useTheme } from '../ui/useTheme';
import { RuleForm } from './RuleForm';

const primaryButtonStyle: CSSProperties = {
    background: 'var(--accent)',
    color: 'var(--accent-contrast)',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    padding: '8px 14px',
    fontSize: 13,
    fontWeight: 600,
};

const ruleRowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 12px',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    marginBottom: 8,
    background: 'var(--surface)',
};

export function Options() {
    const [theme, toggleTheme] = useTheme();
    const [rules, setRules] = useState<IRilogRule[]>([]);
    const [editing, setEditing] = useState<IRilogRule | null>(null);

    const load = () => {
        chrome.runtime.sendMessage({ type: 'rilog/get-rules' }, (response: TRuntimeResponse) => {
            if (response?.type === 'rilog/rules') setRules(response.rules);
        });
    };

    useEffect(load, []);

    const onSave = (rule: IRilogRule) => {
        chrome.runtime.sendMessage({ type: 'rilog/save-rule', rule }, (response: TRuntimeResponse) => {
            if (response?.type === 'rilog/rules') setRules(response.rules);
            setEditing(null);
        });
    };

    const onDelete = (ruleId: string) => {
        if (!confirm('Delete this rule?')) return;
        chrome.runtime.sendMessage({ type: 'rilog/delete-rule', ruleId }, (response: TRuntimeResponse) => {
            if (response?.type === 'rilog/rules') setRules(response.rules);
        });
    };

    return (
        <div style={{ maxWidth: 780, margin: '0 auto', padding: '24px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
                <h1 style={{ fontSize: 18, margin: 0 }}>Rilog DevTools — Rules</h1>
                <div style={{ flex: 1 }} />
                <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
                Rules match captured events by type, URL, status, body, or click selector, and can notify you, pin the event, or route it into a
                named filter tab in the DevTools panel.
            </p>

            {editing ? (
                <RuleForm rule={editing} onSave={onSave} onCancel={() => setEditing(null)} />
            ) : (
                <>
                    <button onClick={() => setEditing(createEmptyRule())} style={primaryButtonStyle}>
                        + New rule
                    </button>

                    <div style={{ marginTop: 16 }}>
                        {rules.length === 0 && <div style={{ color: 'var(--text-faint)' }}>No rules yet.</div>}
                        {rules.map((rule) => (
                            <div key={rule.id} style={ruleRowStyle}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600 }}>{rule.name || '(untitled rule)'}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                                        {rule.eventTypes.length ? `${rule.eventTypes.length} type(s)` : 'any type'} · {rule.actions.length} action(s) · {rule.enabled ? 'enabled' : 'disabled'}
                                    </div>
                                </div>
                                <button onClick={() => setEditing(rule)} className="rilog-icon-btn" style={{ width: 'auto', padding: '4px 10px' }}>
                                    Edit
                                </button>
                                <button onClick={() => onDelete(rule.id)} className="rilog-icon-btn" style={{ width: 'auto', padding: '4px 10px' }}>
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
