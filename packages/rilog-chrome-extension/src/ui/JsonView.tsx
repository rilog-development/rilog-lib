import { ReactNode, useMemo, useState } from 'react';

function PrimitiveValue({ value }: { value: unknown }) {
    if (value === null) return <span style={{ color: 'var(--text-faint)' }}>null</span>;
    if (value === undefined) return <span style={{ color: 'var(--text-faint)' }}>undefined</span>;
    if (typeof value === 'string') return <span style={{ color: 'var(--type-click)' }}>"{value}"</span>;
    if (typeof value === 'number') return <span style={{ color: 'var(--type-request)' }}>{value}</span>;
    if (typeof value === 'boolean') return <span style={{ color: 'var(--type-input)' }}>{String(value)}</span>;
    return <span>{String(value)}</span>;
}

interface IRow {
    path: string;
    depth: number;
    content: ReactNode;
    togglePath?: string;
}

/** Flattens the JSON tree into one entry per visible line so we can number lines like a code
 * editor — a recursive component tree has no single place to count "how many lines came before". */
function buildRows(value: unknown, label: string | undefined, depth: number, path: string, collapsedPaths: Set<string>, rows: IRow[]) {
    const isObject = value !== null && typeof value === 'object';
    const labelNode = label !== undefined && <span style={{ color: 'var(--text-muted)' }}>{label}: </span>;

    if (!isObject) {
        rows.push({
            path,
            depth,
            content: (
                <>
                    {labelNode}
                    <PrimitiveValue value={value} />
                </>
            ),
        });
        return;
    }

    const isArray = Array.isArray(value);
    const entries = isArray ? (value as unknown[]).map((v, i) => [String(i), v] as const) : Object.entries(value as Record<string, unknown>);
    const [open, close] = isArray ? ['[', ']'] : ['{', '}'];

    if (entries.length === 0) {
        rows.push({
            path,
            depth,
            content: (
                <>
                    {labelNode}
                    <span style={{ color: 'var(--text-faint)' }}>
                        {open}
                        {close}
                    </span>
                </>
            ),
        });
        return;
    }

    const collapsed = collapsedPaths.has(path);
    rows.push({
        path,
        depth,
        togglePath: path,
        content: (
            <>
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
            </>
        ),
    });

    if (!collapsed) {
        for (const [key, val] of entries) {
            buildRows(val, isArray ? undefined : key, depth + 1, `${path}.${key}`, collapsedPaths, rows);
        }
        rows.push({ path: `${path}:close`, depth, content: <span style={{ color: 'var(--text-faint)' }}>{close}</span> });
    }
}

export function JsonView({ value }: { value: unknown }) {
    const [collapsedPaths, setCollapsedPaths] = useState<Set<string>>(new Set());

    const toggle = (path: string) =>
        setCollapsedPaths((prev) => {
            const next = new Set(prev);
            if (next.has(path)) next.delete(path);
            else next.add(path);
            return next;
        });

    const rows = useMemo(() => {
        const acc: IRow[] = [];
        buildRows(value, undefined, 0, '$', collapsedPaths, acc);
        return acc;
    }, [value, collapsedPaths]);

    const lineNoWidth = Math.max(18, String(rows.length).length * 8) + 10;

    return (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.7 }}>
            {rows.map((row, i) => (
                <div key={row.path} style={{ display: 'flex' }}>
                    <div
                        style={{
                            width: lineNoWidth,
                            flexShrink: 0,
                            textAlign: 'right',
                            paddingRight: 10,
                            marginRight: 10,
                            color: 'var(--text-faint)',
                            opacity: 0.55,
                            userSelect: 'none',
                            borderRight: '1px solid var(--border)',
                        }}
                    >
                        {i + 1}
                    </div>
                    <div
                        style={{ paddingLeft: row.depth * 14, flex: 1, cursor: row.togglePath ? 'pointer' : undefined, userSelect: row.togglePath ? 'none' : undefined }}
                        onClick={row.togglePath ? () => toggle(row.togglePath!) : undefined}
                    >
                        {row.content}
                    </div>
                </div>
            ))}
        </div>
    );
}
