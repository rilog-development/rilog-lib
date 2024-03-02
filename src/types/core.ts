import { IRilogMessageConfig } from '../feature/interceptors/message/types';
import { IRilogEventItem } from './events';
import { TRilogPushRequest, TRilogPushResponse } from './requests';

export type TOnPushEvent = (event: IRilogEventItem) => void;
export type TOnSaveEvents = (event: IRilogEventItem[]) => void;

export interface IRilog {
    init({ key, config }: TRilogInit): void;
    interceptRequestAxios(data: TRilogPushRequest): void;
    interceptResponseAxios(data: TRilogPushResponse): void;
    saveData<T>(data: T, config: IRilogMessageConfig): void;
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
    disableFetchInterceptor: boolean; // disable fetch interception
    disableClickInterceptor: boolean; // disable click on button/links interception
    localServer: ILocalServerConfig; // for storing events to rilog local server. Needs to install rilog-local-logger.
    selfServer: ISelfServer; // for storing events to client backend. Pass this url to saveEvents method.
    onPushEvent: TOnPushEvent | null; // add push event callback
    onSaveEvents: TOnSaveEvents | null; // add save events callback
}>;

export interface ILocalServerConfig {
    appName: string; // app name would be used in local saving for creating app logs folder.
    params?: Record<string, string>; // additional params for storing in the header of logs files.
}

export interface ISelfServer {
    url: string; // url should include "events/save" in the url
    headers?: Record<string, string>;
}

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

export type TRilogExtensions = {
    interactivePanel: null | IRilogExtension;
};

export interface IRilogExtension {
    build(): void; // required method for call extension
}

export type TUpdateStateFn = (state: Partial<TRilogState>) => void;
