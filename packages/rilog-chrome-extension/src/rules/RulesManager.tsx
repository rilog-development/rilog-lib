import { CSSProperties, useEffect, useRef, useState } from 'react';
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

const plainButtonStyle: CSSProperties = {
    background: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--text-muted)',
    borderRadius: 'var(--radius-sm)',
    padding: '4px 10px',
    fontSize: 12,
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

function isRuleShaped(value: unknown): value is IRilogRule {
    return !!value && typeof value === 'object' && typeof (value as IRilogRule).id === 'string' && typeof (value as IRilogRule).eventType === 'number' && Array.isArray((value as IRilogRule).actions);
}

/**
 * Shared between the standalone Options page (chrome-extension://.../src/options/index.html,
 * reached via right-click-icon → Options or the popup) and the DevTools panel's in-place
 * "Rules" view — same component either way, no separate page navigation needed from the panel.
 *
 * `onRulesChanged` is optional so the standalone Options page (a separate document with no
 * shared React tree) can render this with no props, while the panel wires it up to keep its own
 * top-level `rules` state (used for Events' filter tabs and "matched rules" badges) in sync —
 * otherwise a rule saved here would silently not show up over there until the panel reloaded.
 */
export function RulesManager({ onRulesChanged }: { onRulesChanged?: (rules: IRilogRule[]) => void } = {}) {
    const [rules, setRulesState] = useState<IRilogRule[]>([]);
    const [editing, setEditing] = useState<IRilogRule | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const setRules = (next: IRilogRule[]) => {
        setRulesState(next);
        onRulesChanged?.(next);
    };

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

    const onExportRules = () => {
        const blob = new Blob([JSON.stringify(rules, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rilog-rules-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const onImportRulesFile = (file: File) => {
        file.text().then((text) => {
            let parsed: unknown;
            try {
                parsed = JSON.parse(text);
            } catch {
                return; // not valid JSON — silently ignore
            }
            if (!Array.isArray(parsed)) return;

            const imported = parsed.filter(isRuleShaped);
            if (imported.length === 0) return;

            chrome.runtime.sendMessage({ type: 'rilog/import-rules', rules: imported }, (response: TRuntimeResponse) => {
                if (response?.type === 'rilog/rules') setRules(response.rules);
            });
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
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button onClick={() => setEditing(createEmptyRule())} style={primaryButtonStyle}>
                            + New rule
                        </button>
                        <div style={{ flex: 1 }} />
                        <button onClick={onExportRules} title="Download all rules as a JSON file" style={plainButtonStyle}>
                            Export
                        </button>
                        <button onClick={() => fileInputRef.current?.click()} title="Load rules from a previously exported JSON file" style={plainButtonStyle}>
                            Import
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="application/json"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) onImportRulesFile(file);
                                e.target.value = '';
                            }}
                        />
                    </div>

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
