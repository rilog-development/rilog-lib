import { IRilogRequest, IRilogResponse, TRilogPushRequest, TRilogPushResponse } from '@rilog-development/rilog-shared';

export interface IAxiosAdapter {
    getRequest(data: TRilogPushRequest): IRilogRequest | null;
    getResponse(data: TRilogPushResponse): IRilogResponse | null;
}
