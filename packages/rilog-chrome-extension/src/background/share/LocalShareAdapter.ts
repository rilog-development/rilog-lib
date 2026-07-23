import { IRilogEventItem } from '@rilog-development/rilog-shared';
import { IShareAdapter, IShareResult } from '../../types/share';

const SHARE_STORAGE_PREFIX = 'rilog_shared_event_';

function generateShareId(): string {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/**
 * v1 share adapter: no backend yet. Serializes the event into chrome.storage.local under a
 * short id and points at the extension's own share.html viewer. A future RemoteShareAdapter
 * (same IShareAdapter interface) can POST to the real Rilog cloud API once it exists.
 */
export class LocalShareAdapter implements IShareAdapter {
    async publish(event: IRilogEventItem): Promise<IShareResult> {
        const id = generateShareId();
        await chrome.storage.local.set({ [`${SHARE_STORAGE_PREFIX}${id}`]: event });
        return { url: chrome.runtime.getURL(`src/share/index.html#${id}`) };
    }
}

export async function getSharedEvent(id: string): Promise<IRilogEventItem | undefined> {
    const key = `${SHARE_STORAGE_PREFIX}${id}`;
    const result = await chrome.storage.local.get(key);
    return result[key] as IRilogEventItem | undefined;
}
