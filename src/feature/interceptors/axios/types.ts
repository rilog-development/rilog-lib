import { IRilogRequest, IRilogResponse, TRilogPushRequest, TRilogPushResponse } from "../../../types";

export interface IAxiosInterceptor {
    onRequest(data: TRilogPushRequest): void;
    onResponse(data: TRilogPushResponse): void
}

export interface IAxiosAdapter {
    getRequest(data: TRilogPushRequest): IRilogRequest | null
    getResponse(data:TRilogPushResponse): IRilogResponse | null
}