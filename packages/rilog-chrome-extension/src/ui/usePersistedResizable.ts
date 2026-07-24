import { useCallback, useEffect, useRef, useState } from 'react';

/** Same drag behavior as useResizable, but the size is loaded from and saved to
 * chrome.storage.local under `storageKey`, so it survives closing/reopening the panel. */
export function usePersistedResizable(storageKey: string, initial: number, min: number, max: number, axis: 'x' | 'y') {
    const [size, setSize] = useState(initial);
    const startRef = useRef({ pos: 0, size: 0 });

    useEffect(() => {
        chrome.storage?.local.get(storageKey).then((result) => {
            const stored = result[storageKey] as number | undefined;
            if (typeof stored === 'number') setSize(Math.min(max, Math.max(min, stored)));
        });
        // only load once per mount — min/max are static bounds, not reasons to reload
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storageKey]);

    const onPointerDown = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            startRef.current = { pos: axis === 'x' ? e.clientX : e.clientY, size };
            e.currentTarget.setPointerCapture(e.pointerId);
        },
        [axis, size],
    );

    const onPointerMove = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (e.buttons !== 1) return;
            const pos = axis === 'x' ? e.clientX : e.clientY;
            const delta = pos - startRef.current.pos;
            setSize(Math.min(max, Math.max(min, startRef.current.size - delta)));
        },
        [axis, min, max],
    );

    const onPointerUp = useCallback(() => {
        setSize((current) => {
            chrome.storage?.local.set({ [storageKey]: current });
            return current;
        });
    }, [storageKey]);

    return { size, handleProps: { onPointerDown, onPointerMove, onPointerUp } };
}
