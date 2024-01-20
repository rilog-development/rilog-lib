import { IRilogMessageConfig } from '../feature/interceptors/message/types';
import { IRilogEventItem } from './events';
import { TRilogPushRequest, TRilogPushResponse } from './requests';

export type TOnPushEvent = (event: IRilogEventItem) => void;
export type TOnSaveEvents = (event: IRilogEventItem[]) => void;

export interface IRilog {
    state: TRilogState;
    init({ key, config }: TRilogInit): void;
    interceptRequestAxios(data: TRilogPushRequest): void;
    interceptResponseAxios(data: TRilogPushResponse): void;
    saveData<T>(data: T, config: IRilogMessageConfig): void;
    onPushEvent?: TOnPushEvent | null; // add push event callback
    onSaveEvents?: TOnSaveEvents | null; // add save events callback
}

export type TRilogInit = {
    key: string;
    config?: TRilogInitConfig;
};

export type TRilogInitConfig = Partial<{
    ignoredRequests: string[]; // ignore this requests (do not save this)
    sensetiveRequsts: string[]; // this request will not be written,
    sensetiveDataRequests: string[]; // will not be written data to requests (example: card data),
    headers: string[]; // write only this headers,
    localStorage: string[]; // only this params will be stored
    timeout: number; // in ms, when user didn't get response from server.
    disableFetchInterceptor: boolean; // disable fetch interception
    disableClickInterceptor: boolean; // TODO: (test) disable click on button/links interception
}>;

export type TInitRequest = {
    uToken: string;
    appId: string;
    externalInfo?: object;
};

export type TRilogState = {
    init: boolean; // app done init
    token: null | string; // token for user auth requests
    salt: null | string; // salt for encoding push data
    recording: boolean; // enable/disable recording requests
    key: null | string; // app key for connection to back (to your current app),
    config: null | TRilogInitConfig; // config for requests
};

export type TUpdateStateFn = (state: Partial<TRilogState>) => void;
