import { IRilogEventItem, IRilogRequestTimed } from '@rilog-development/rilog-shared';

export interface IRilogFilterRequest {
    getRequests(data: IRilogRequestTimed): IRilogRequestTimed;
    isLibruaryRequest(data: IRilogRequestTimed): boolean;
    isIgnoredRequest(data: IRilogRequestTimed): boolean;
    sortEventsByDate(data: IRilogEventItem[]): IRilogEventItem[];
}
