import { RilogInputEvent } from '../feature/interceptors/input/types';
import { IRilogMessageConfig } from '../feature/interceptors/message/types';
import { TRilogInitConfig, TRilogState } from './core';
import { IRilogRequest, IRilogRequestTimed, IRilogResponse } from './requests';

export interface IRilogInterceptror {
    init: TRilogState['init'];
    salt: TRilogState['salt'];
    token: TRilogState['token'];
    onClick(event: any): void;
    onSaveData<T>(data: T, config: IRilogMessageConfig): void;
    onRequest(request: IRilogRequest): void;
    onResponse(response: IRilogResponse): void;
}

export interface IRilogInterceptorState {
    request: null | IRilogRequestTimed; // push requests data
}

export type TSendEvents = {
    data: string;
    token: string;
} & Pick<TRilogInitConfig, 'localServer' | 'selfServer'>;
