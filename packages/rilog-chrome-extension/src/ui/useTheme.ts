import { useCallback, useEffect, useState } from 'react';

export type TTheme = 'dark' | 'light';

const THEME_STORAGE_KEY = 'rilog_theme';

function systemPreference(): TTheme {
    return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function useTheme(): [TTheme, () => void] {
    const [theme, setTheme] = useState<TTheme>('dark');

    useEffect(() => {
        let cancelled = false;

        chrome.storage?.local.get(THEME_STORAGE_KEY).then((result) => {
            if (cancelled) return;
            const stored = result[THEME_STORAGE_KEY] as TTheme | undefined;
            setTheme(stored ?? systemPreference());
        });

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const toggle = useCallback(() => {
        setTheme((prev) => {
            const next: TTheme = prev === 'dark' ? 'light' : 'dark';
            chrome.storage?.local.set({ [THEME_STORAGE_KEY]: next });
            return next;
        });
    }, []);

    return [theme, toggle];
}
