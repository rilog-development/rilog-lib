import { IRilogEventItem } from '@rilog-development/rilog-shared';
import { IShareAdapter, IShareResult } from '../../types/share';

/**
 * Stub for when the Rilog cloud web app exposes a public-events endpoint. Not wired up
 * anywhere yet — implement `publish` to POST to that API once it exists, then swap it in
 * for `LocalShareAdapter` behind an options-page toggle.
 */
export class RemoteShareAdapter implements IShareAdapter {
    constructor(private readonly apiBaseUrl: string) {}

    async publish(_event: IRilogEventItem): Promise<IShareResult> {
        throw new Error(`RemoteShareAdapter is not implemented yet (would POST to ${this.apiBaseUrl}/public-events)`);
    }
}
