import { useState } from 'react';

function stringify(value: unknown): string {
    if (value === null || value === undefined) return String(value);
    if (typeof value === 'string') {
        try {
            return JSON.stringify(JSON.parse(value), null, 2);
        } catch {
            return value;
        }
    }
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
}

export function CodeBlock({ value, maxHeight = 220 }: { value: unknown; maxHeight?: number }) {
    const [copied, setCopied] = useState(false);
    const text = stringify(value);

    const onCopy = () => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        });
    };

    return (
        <div style={{ position: 'relative' }}>
            <pre
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
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                }}
            >
                {text}
            </pre>
            <button
                onClick={onCopy}
                className="rilog-icon-btn"
                title="Copy"
                style={{ position: 'absolute', top: 6, right: 6, width: 'auto', padding: '3px 8px', fontSize: 11, fontWeight: 600 }}
            >
                {copied ? 'Copied' : 'Copy'}
            </button>
        </div>
    );
}
