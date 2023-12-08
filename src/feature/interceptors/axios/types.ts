import { IRilogRequest, IRilogResponse, TRilogPushRequest, TRilogPushResponse } from '../../../types';

export interface IAxiosAdapter {
    getRequest(data: TRilogPushRequest): IRilogRequest | null;
    getResponse(data: TRilogPushResponse): IRilogResponse | null;
}
