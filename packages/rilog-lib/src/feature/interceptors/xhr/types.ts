import { IRilogRequest, IRilogResponse } from '@rilog-development/rilog-shared';

export type TRilogXHRRequest = {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: Document | XMLHttpRequestBodyInit | null;
};

export type TRilogXHRResponse = {
    url: string;
    status: number | string;
    data: string;
};

export interface IXHRAdapter {
    getRequest(data: TRilogXHRRequest): IRilogRequest | null;
    getResponse(data: TRilogXHRResponse): IRilogResponse | null;
}
