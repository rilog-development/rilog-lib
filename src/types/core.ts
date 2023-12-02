import { IRilogRequestTimed, TRilogPushRequest, TRilogPushResponse } from './requests';

export interface IRilog {
    state: TRilogState;
    init({ key, config }: TRilogInit): void;
    interceptRequestAxios(data: TRilogPushRequest): void;
    interceptResponseAxios(data: TRilogPushResponse): void;
}

export type TRilogInit = {
    key: string;
    config?: TRilogInitConfig;
};

export type TRilogInitConfig = {
    sensetiveRequsts?: string[]; // this request will not be written,
    sensetiveDataRequests?: string[]; // will not be written data to requests (example: card data),
    headers?: string[]; // write only this headers,
    localStorage?: string[]; // only this params will be stored
    timeout?: number; // in ms, when user didn't get response from server.
    disableFetchInterceptor?: boolean // disable fetch interception
};

export type TInitRequest = {
    uToken: string;
    appId: string;
    externalInfo?: object;
};

export type TRilogState = {
    init: boolean; // app done init
    request: null | IRilogRequestTimed; // push requests data
    token: null | string; // token for user auth requests
    salt: null | string; // salt for encoding push data
    recording: boolean; // enable/disable recording requests
    key: null | string; // app key for connection to back (to your current app),
    config: null | TRilogInitConfig; // config for requests
    shortTimer: null | any; // Use it for saving request data (if request data equal to REQUESTS_ARRAY_LIMIT)
    longTimer: null | any; // Use it saving request data (if user did not do requests during a long time),
};

export type TUpdateStateFn = (state: Partial<TRilogState>) => void;
