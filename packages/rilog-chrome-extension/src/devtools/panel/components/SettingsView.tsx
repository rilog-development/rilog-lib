import { useState } from 'react';
import { TRuntimeResponse } from '../../../types/messages';
import { IRilogSettings } from '../../../types/settings';

const inputStyle: React.CSSProperties = {
    flex: 1,
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text)',
    padding: '6px 9px',
    fontSize: 12.5,
    outline: 'none',
};

export function SettingsView({ settings, onSaved }: { settings: IRilogSettings; onSaved: (settings: IRilogSettings) => void }) {
    const [draft, setDraft] = useState(settings);
    const [newPattern, setNewPattern] = useState('');
    const [saved, setSaved] = useState(false);

    const persist = (next: IRilogSettings) => {
        setDraft(next);
        chrome.runtime.sendMessage({ type: 'rilog/save-settings', settings: next }, (response: TRuntimeResponse) => {
            if (response?.type === 'rilog/settings') {
                onSaved(response.settings);
                setSaved(true);
                setTimeout(() => setSaved(false), 1200);
            }
        });
    };

    const addPattern = () => {
        const value = newPattern.trim();
        if (!value || draft.ignoredUrlPatterns.includes(value)) return;
        persist({ ...draft, ignoredUrlPatterns: [...draft.ignoredUrlPatterns, value] });
        setNewPattern('');
    };

    const removePattern = (pattern: string) => {
        persist({ ...draft, ignoredUrlPatterns: draft.ignoredUrlPatterns.filter((p) => p !== pattern) });
    };

    return (
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px', maxWidth: 700 }}>
            <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={draft.autoScroll} onChange={(e) => persist({ ...draft, autoScroll: e.target.checked })} />
                    Auto-scroll the Events table to the newest event
                </label>
            </div>

            <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--text-faint)', marginBottom: 6 }}>Feature flags</div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={draft.featureFlags.share}
                        onChange={(e) => persist({ ...draft, featureFlags: { ...draft.featureFlags, share: e.target.checked } })}
                    />
                    Show the Share button on the event detail panel
                </label>
                <p style={{ color: 'var(--text-muted)', fontSize: 12.5, marginTop: 4, marginBottom: 0 }}>
                    Off by default — sharing copies the full request/response, including bodies, to a shareable link.
                </p>
            </div>

            <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--text-faint)', marginBottom: 6 }}>Ignored URLs</div>
                <p style={{ color: 'var(--text-muted)', fontSize: 12.5, marginTop: 0, marginBottom: 12 }}>
                    Requests whose URL contains any of these (case-insensitive) are never captured at all — e.g. analytics/health-check noise. For
                    anything more specific (event type, status, body content), use a rule with an <b>Ignore</b> action instead.
                </p>

                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <input
                        style={inputStyle}
                        value={newPattern}
                        onChange={(e) => setNewPattern(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addPattern()}
                        placeholder="google-analytics.com"
                    />
                    <button className="rilog-icon-btn" style={{ width: 'auto', padding: '4px 12px' }} onClick={addPattern}>
                        Add
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {draft.ignoredUrlPatterns.length === 0 && <div style={{ color: 'var(--text-faint)', fontSize: 12.5 }}>No ignored URL patterns yet.</div>}
                    {draft.ignoredUrlPatterns.map((pattern) => (
                        <div
                            key={pattern}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)' }}
                        >
                            <span style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 12 }}>{pattern}</span>
                            <button onClick={() => removePattern(pattern)} className="rilog-icon-btn" style={{ width: 'auto', padding: '2px 8px' }}>
                                Remove
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {saved && <div style={{ marginTop: 16, color: 'var(--accent)', fontSize: 12 }}>Saved.</div>}
        </div>
    );
}
