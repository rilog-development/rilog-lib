import { IRilogMessageConfig } from '../feature/interceptors/message/types';
import { TRilogInitConfig, TRilogState } from './core';
import { IRilogRequest, IRilogResponse } from './requests';

export interface IRilogInterceptror {
    init: TRilogState['init'];
    salt: TRilogState['salt'];
    token: TRilogState['token'];
    uToken: string | null;
    onClick(event: any): void;
    onLogData<T>(data: T, config: IRilogMessageConfig, stackTrace?: string): void;
    onRequest(request: IRilogRequest): void;
    onResponse(response: IRilogResponse): void;
}

export type TSendEvents = {
    data: string;
    token: string;
} & Pick<TRilogInitConfig, 'localServer' | 'selfServer'>;
