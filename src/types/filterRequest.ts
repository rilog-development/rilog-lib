import { IRilogRequestTimed } from './requests';

export interface IRilogFilterRequest {
    getRequests(data: IRilogRequestTimed): IRilogRequestTimed;
    isLibruaryRequest(data: IRilogRequestTimed): boolean;
    isIgnoredRequest(data: IRilogRequestTimed): boolean;
}
