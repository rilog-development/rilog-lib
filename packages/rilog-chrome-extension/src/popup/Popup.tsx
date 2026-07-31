import { useEffect, useState } from 'react';
import { CAPTURE_ENABLED_STORAGE_KEY, TRuntimeResponse } from '../types/messages';
import { Logo } from '../ui/Logo';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useTheme } from '../ui/useTheme';

export function Popup() {
    const [theme, toggleTheme] = useTheme();
    const [tabId, setTabId] = useState<number | null>(null);
    const [eventCount, setEventCount] = useState<number | null>(null);
    const [captureEnabled, setCaptureEnabled] = useState(true);

    useEffect(() => {
        chrome.storage.local.get(CAPTURE_ENABLED_STORAGE_KEY).then((result) => {
            setCaptureEnabled(result[CAPTURE_ENABLED_STORAGE_KEY] ?? true);
        });

        chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
            if (!tab?.id) return;
            setTabId(tab.id);
            chrome.runtime.sendMessage({ type: 'rilog/get-events', tabId: tab.id }, (response: TRuntimeResponse) => {
                if (response?.type === 'rilog/events') setEventCount(response.events.length);
            });
        });
    }, []);

    const onToggleCapture = () => {
        const next = !captureEnabled;
        setCaptureEnabled(next);
        chrome.storage.local.set({ [CAPTURE_ENABLED_STORAGE_KEY]: next });
    };

    return (
        <div style={{ padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Logo height={18} />
                <span style={{ fontWeight: 600, fontSize: 12.5, color: 'var(--text-muted)' }}>DevTools</span>
                <div style={{ flex: 1 }} />
                <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </div>

            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 12, marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 2 }}>Events captured on this tab</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{eventCount ?? '—'}</div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, marginBottom: 12, cursor: 'pointer' }}>
                <input type="checkbox" checked={captureEnabled} onChange={onToggleCapture} />
                Capture new events{tabId === null ? '' : ' on new page loads'}
            </label>

            <p style={{ fontSize: 11.5, color: 'var(--text-faint)', margin: '0 0 12px' }}>Open DevTools (F12) and go to the <b>Rilog</b> tab for the full event list, filters, and rules.</p>

            <button
                onClick={() => chrome.runtime.openOptionsPage()}
                style={{ width: '100%', background: 'var(--accent)', color: 'var(--accent-contrast)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '8px 0', fontSize: 12.5, fontWeight: 600 }}
            >
                Manage rules
            </button>
        </div>
    );
}
