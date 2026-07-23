import { IRilogEventItem } from '@rilog-development/rilog-shared';

export interface IShareResult {
    url: string;
}

export interface IShareAdapter {
    publish(event: IRilogEventItem): Promise<IShareResult>;
}
