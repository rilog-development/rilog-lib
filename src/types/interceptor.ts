import { TRilogState } from './core';
import { IRilogRequest, IRilogRequestTimed, IRilogResponse } from './requests';

export interface IRilogInterceptror {
    salt: TRilogState['salt'];
    token: TRilogState['token'];
    onRequest(request: IRilogRequest): void;
    onResponse(response: IRilogResponse): void;
}

export interface IRilogInterceptorState {
    request: null | IRilogRequestTimed; // push requests data
}
