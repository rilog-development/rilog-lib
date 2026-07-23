import { IRilogEventItem } from '@rilog-development/rilog-shared';

export interface IRilogClickInterceptor {
    getClickEvent(event: any): IRilogEventItem | undefined;
}
