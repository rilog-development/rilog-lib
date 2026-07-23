export interface IFilterState {
    search: string;
    urlContains: string;
    status: 'all' | '2xx' | '4xx' | '5xx';
    label: string;
}

const inputStyle: React.CSSProperties = {
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text)',
    padding: '5px 9px',
    fontSize: 12,
    outline: 'none',
};

export function FilterBar({ value, onChange }: { value: IFilterState; onChange: (next: IFilterState) => void }) {
    const set = (patch: Partial<IFilterState>) => onChange({ ...value, ...patch });

    return (
        <div style={{ display: 'flex', gap: 8, padding: '8px 14px', background: 'var(--bg)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <input style={{ ...inputStyle, flex: 2 }} placeholder="Search…" value={value.search} onChange={(e) => set({ search: e.target.value })} />
            <input style={{ ...inputStyle, flex: 2 }} placeholder="URL contains…" value={value.urlContains} onChange={(e) => set({ urlContains: e.target.value })} />
            <select style={{ ...inputStyle, flex: 1 }} value={value.status} onChange={(e) => set({ status: e.target.value as IFilterState['status'] })}>
                <option value="all">All statuses</option>
                <option value="2xx">2xx</option>
                <option value="4xx">4xx</option>
                <option value="5xx">5xx</option>
            </select>
            <input style={{ ...inputStyle, flex: 1 }} placeholder="Label…" value={value.label} onChange={(e) => set({ label: e.target.value })} />
        </div>
    );
}
