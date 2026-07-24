import { createDefaultSettings, IRilogSettings } from '../types/settings';

const SETTINGS_STORAGE_KEY = 'rilog_settings';

export async function getSettings(): Promise<IRilogSettings> {
    const result = await chrome.storage.local.get(SETTINGS_STORAGE_KEY);
    const stored = result[SETTINGS_STORAGE_KEY] as IRilogSettings | undefined;
    return { ...createDefaultSettings(), ...stored };
}

export async function saveSettings(settings: IRilogSettings): Promise<IRilogSettings> {
    await chrome.storage.local.set({ [SETTINGS_STORAGE_KEY]: settings });
    return settings;
}

export function isUrlIgnored(url: string, patterns: string[]): boolean {
    const lower = url.toLowerCase();
    return patterns.some((p) => p.trim() && lower.includes(p.trim().toLowerCase()));
}
