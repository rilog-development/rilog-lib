import { TRilogState } from './core';
import { IRilogRequest, IRilogRequestTimed, IRilogResponse } from './requests';

export interface IRilogInterceptror {
    salt: TRilogState['salt'];
    token: TRilogState['token'];
    prepareRequest(request: IRilogRequest): void;
    prepareResponse(response: IRilogResponse, request: IRilogRequestTimed | null): void;
}
