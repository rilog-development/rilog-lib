import { useState } from 'react';

function PrimitiveValue({ value }: { value: unknown }) {
    if (value === null) return <span style={{ color: 'var(--text-faint)' }}>null</span>;
    if (value === undefined) return <span style={{ color: 'var(--text-faint)' }}>undefined</span>;
    if (typeof value === 'string') return <span style={{ color: 'var(--type-click)' }}>"{value}"</span>;
    if (typeof value === 'number') return <span style={{ color: 'var(--type-request)' }}>{value}</span>;
    if (typeof value === 'boolean') return <span style={{ color: 'var(--type-input)' }}>{String(value)}</span>;
    return <span>{String(value)}</span>;
}

function JsonNode({ label, value, depth }: { label?: string; value: unknown; depth: number }) {
    const isObject = value !== null && typeof value === 'object';
    const isArray = Array.isArray(value);
    const [collapsed, setCollapsed] = useState(false);

    const labelNode = label !== undefined && <span style={{ color: 'var(--text-muted)' }}>{label}: </span>;

    if (!isObject) {
        return (
            <div style={{ paddingLeft: depth * 14 }}>
                {labelNode}
                <PrimitiveValue value={value} />
            </div>
        );
    }

    const entries = isArray ? (value as unknown[]).map((v, i) => [String(i), v] as const) : Object.entries(value as Record<string, unknown>);
    const [open, close] = isArray ? ['[', ']'] : ['{', '}'];

    if (entries.length === 0) {
        return (
            <div style={{ paddingLeft: depth * 14 }}>
                {labelNode}
                <span style={{ color: 'var(--text-faint)' }}>
                    {open}
                    {close}
                </span>
            </div>
        );
    }

    return (
        <div>
            <div style={{ paddingLeft: depth * 14, cursor: 'pointer', userSelect: 'none' }} onClick={() => setCollapsed((c) => !c)}>
                <span style={{ display: 'inline-block', width: 12, color: 'var(--text-faint)' }}>{collapsed ? '▶' : '▼'}</span>
                {labelNode}
                <span style={{ color: 'var(--text-faint)' }}>
                    {open}
                    {collapsed && (
                        <span>
                            {' '}
                            {entries.length} {isArray ? 'item' + (entries.length === 1 ? '' : 's') : 'key' + (entries.length === 1 ? '' : 's')} {close}
                        </span>
                    )}
                </span>
            </div>
            {!collapsed && (
                <>
                    {entries.map(([key, val]) => (
                        <JsonNode key={key} label={isArray ? undefined : key} value={val} depth={depth + 1} />
                    ))}
                    <div style={{ paddingLeft: depth * 14, color: 'var(--text-faint)' }}>{close}</div>
                </>
            )}
        </div>
    );
}

export function JsonView({ value }: { value: unknown }) {
    return (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.7 }}>
            <JsonNode value={value} depth={0} />
        </div>
    );
}
