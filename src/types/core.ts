import { IRilogMessageConfig } from '../feature/interceptors/message/types';
import { IRilogEventItem } from './events';
import { TRilogPushRequest, TRilogPushResponse } from './requests';

export type TOnPushEvent = (event: IRilogEventItem) => void;
export type TOnSaveEvents = (event: IRilogEventItem[]) => void;

export interface IAxiosLike {
    interceptors: {
        request: { use(onFulfilled: (config: any) => any): any };
        response: { use(onFulfilled: (response: any) => any, onRejected: (error: any) => any): any };
    };
}

export interface IRilog {
    init(config?: TRilogInitConfig): void;
    interceptRequestAxios(data: TRilogPushRequest): void;
    interceptResponseAxios(data: TRilogPushResponse): void;
    logData<T>(data: T, config: IRilogMessageConfig): void;
    wrapAxios<T extends IAxiosLike>(instance: T): T;
}

export type TRilogInitConfig = Partial<{
    ignoredRequests: string[]; // ignore this requests (do not save this)
    sensetiveRequsts: string[]; // this request will not be written,
    sensetiveDataRequests: string[]; // will not be written data to requests (example: card data),
    headers: string[]; // write only this headers,
    localStorage: string[]; // only this params will be stored
    disableFetchInterceptor: boolean; // disable fetch interception
    disableXHRInterceptor: boolean; // disable XMLHttpRequest interception
    disableClickInterceptor: boolean; // disable click on button/links interception
    disableConsoleInterceptor: boolean; // disable console.warn/console.error interception
    disableInputInterceptor: boolean; // disable input focusout interception
    localServer: ILocalServerConfig; // for storing events to rilog local server. Needs to install rilog-local-logger.
    selfServer: ISelfServer; // for storing events to client backend. Pass this url to saveEvents method.
    deployServer: IDeployServerConfig; // for storing events to Rilog cloud backend.
    onPushEvent: TOnPushEvent | null; // add push event callback
    onSaveEvents: TOnSaveEvents | null; // add save events callback
    meta: TExternalInfoMeta; // environment metadata attached to every session
}>;

export interface ILocalServerConfig {
    appName: string; // app name would be used in local saving for creating app logs folder.
    url: string; // base URL of the running rilog-local-server instance, e.g. http://localhost:3030
    params?: Record<string, string>; // additional params for storing in the header of logs files.
}

export interface ISelfServer {
    url: string; // full URL of the POST endpoint on your backend (any path you define)
    headers?: Record<string, string>;
}

export interface IDeployServerConfig {
    key: string; // app key for Rilog cloud backend
}

export type TExternalInfoMeta = {
    environment?: string;
    branch?: string;
    framework?: string;
    platform?: string;
};

export type TDeviceInfo = {
    userAgent: string;
    screenWidth: number;
    screenHeight: number;
    viewportWidth: number;
    viewportHeight: number;
    devicePixelRatio: number;
    colorDepth: number;
    language: string;
    hardwareConcurrency: number | null;
    deviceType: 'mobile' | 'tablet' | 'desktop';
    connectionType: string | null;
};

export type TInitRequest = {
    uToken: string;
    appId: string;
    externalInfo?: {
        userAgent: string;
        meta?: TExternalInfoMeta;
    };
    deviceInfo?: TDeviceInfo;
};

export type TRilogState = {
    init: boolean; // app done init
    token: null | string; // access token returned from deploy server init
    recording: boolean; // enable/disable recording requests
    config: null | TRilogInitConfig; // config for requests
};

export type TRilogExtensions = {
    interactivePanel: null | IRilogExtension;
};

export interface IRilogExtension {
    build(): void; // required method for call extension
}

export type TUpdateStateFn = (state: Partial<TRilogState>) => void;
