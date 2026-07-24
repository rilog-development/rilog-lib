import { CSSProperties, useEffect, useState } from 'react';
import { TRuntimeResponse } from '../types/messages';
import { createEmptyRule, IRilogRule } from '../types/rules';
import { EVENT_TYPE_LABEL } from '../ui/eventFormat';
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

/**
 * Shared between the standalone Options page (chrome-extension://.../src/options/index.html,
 * reached via right-click-icon → Options or the popup) and the DevTools panel's in-place
 * "Rules" view — same component either way, no separate page navigation needed from the panel.
 */
export function RulesManager() {
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
        <div>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
                Rules match captured events by type, URL, status, body, or click selector. Besides notifying you or routing into a named filter tab, a{' '}
                <b>Pin</b> action surfaces matches under a built-in "Pinned" tab in Events, and an <b>Ignore</b> action stops matching events from being
                captured at all (e.g. analytics/health-check noise).
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
                                        {EVENT_TYPE_LABEL[rule.eventType]} · {rule.actions.length} action(s){rule.filterTab.enabled ? ` · filter tab “${rule.filterTab.name}”` : ''} ·{' '}
                                        {rule.enabled ? 'enabled' : 'disabled'}
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
