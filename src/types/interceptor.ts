import { IRilogRequest, IRilogRequestTimed, IRilogResponse } from "./requests";

export interface IRilogInterceptror {
    prepareRequest(request: IRilogRequest): void;
    prepareResponse(response: IRilogResponse, request: IRilogRequestTimed | null): void;
}