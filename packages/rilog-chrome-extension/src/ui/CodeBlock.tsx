import { useEffect, useState } from 'react';
import { JsonView } from './JsonView';

function parseValue(value: unknown): unknown {
    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    }
    return value;
}

function stringify(value: unknown): string {
    if (value === null || value === undefined) return String(value);
    const parsed = parseValue(value);
    if (typeof parsed === 'string') return parsed;
    try {
        return JSON.stringify(parsed, null, 2);
    } catch {
        return String(parsed);
    }
}

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            onClick={() =>
                navigator.clipboard.writeText(text).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1200);
                })
            }
            className="rilog-icon-btn"
            title="Copy"
            style={{ width: 'auto', padding: '3px 8px', fontSize: 11, fontWeight: 600 }}
        >
            {copied ? 'Copied' : 'Copy'}
        </button>
    );
}

function Rendered({ parsed, text, maxHeight }: { parsed: unknown; text: string; maxHeight?: number }) {
    const isObject = parsed !== null && typeof parsed === 'object';
    return (
        <div
            style={{
                margin: 0,
                padding: '10px 12px',
                background: 'var(--code-bg)',
                color: 'var(--code-text)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                fontSize: 12,
                maxHeight,
                overflow: 'auto',
                whiteSpace: isObject ? 'normal' : 'pre-wrap',
                wordBreak: 'break-word',
            }}
        >
            {isObject ? <JsonView value={parsed} /> : text}
        </div>
    );
}

/** Full-viewport overlay for reviewing large request/response bodies without the cramped side panel. */
function ExpandedModal({ parsed, text, onClose }: { parsed: unknown; text: string; onClose: () => void }) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
            <div
                onClick={(e) => e.stopPropagation()}
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', maxWidth: '86vw', maxHeight: '86vh' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 0.4 }}>JSON</span>
                    <div style={{ flex: 1 }} />
                    <CopyButton text={text} />
                    <button onClick={onClose} className="rilog-icon-btn" title="Close (Esc)">
                        ✕
                    </button>
                </div>
                <div style={{ padding: 16, overflow: 'auto', maxWidth: '84vw', maxHeight: '78vh' }}>{parsed !== null && typeof parsed === 'object' ? <JsonView value={parsed} /> : <pre style={{ margin: 0, color: 'var(--code-text)', fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{text}</pre>}</div>
            </div>
        </div>
    );
}

export function CodeBlock({ value, maxHeight = 220 }: { value: unknown; maxHeight?: number }) {
    const [expanded, setExpanded] = useState(false);
    const parsed = parseValue(value);
    const text = stringify(value);

    return (
        <div style={{ position: 'relative' }}>
            <Rendered parsed={parsed} text={text} maxHeight={maxHeight} />
            <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 4 }}>
                <button onClick={() => setExpanded(true)} className="rilog-icon-btn" title="Expand" style={{ width: 'auto', padding: '3px 8px', fontSize: 11, fontWeight: 600 }}>
                    ⤢
                </button>
                <CopyButton text={text} />
            </div>
            {expanded && <ExpandedModal parsed={parsed} text={text} onClose={() => setExpanded(false)} />}
        </div>
    );
}
