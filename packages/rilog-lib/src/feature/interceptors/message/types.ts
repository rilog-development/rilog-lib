import { IRilogEventItem, IRilogMessageConfig } from '@rilog-development/rilog-shared';

export interface IRilogMessageInterceptor {
    getMessageEvent: <T>(data: T, config: IRilogMessageConfig | undefined, stackTrace?: string) => IRilogEventItem;
}
