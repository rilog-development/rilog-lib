import { useCallback, useEffect, useState } from 'react';

export type TDock = 'right' | 'bottom';

const DOCK_STORAGE_KEY = 'rilog_panel_dock';

export function usePanelDock(): [TDock, (dock: TDock) => void] {
    const [dock, setDock] = useState<TDock>('right');

    useEffect(() => {
        chrome.storage?.local.get(DOCK_STORAGE_KEY).then((result) => {
            const stored = result[DOCK_STORAGE_KEY] as TDock | undefined;
            if (stored) setDock(stored);
        });
    }, []);

    const update = useCallback((next: TDock) => {
        setDock(next);
        chrome.storage?.local.set({ [DOCK_STORAGE_KEY]: next });
    }, []);

    return [dock, update];
}
