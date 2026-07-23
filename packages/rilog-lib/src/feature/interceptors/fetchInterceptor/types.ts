import { IRilogRequest, IRilogResponse, TRilogPushRequest, TRilogPushResponse } from '@rilog-development/rilog-shared';

export interface IFetchAdapter {
    getRequest(data: TRilogPushRequest): IRilogRequest | null;
    getResponse(data: TRilogPushResponse): IRilogResponse | null;
}
