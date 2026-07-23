import { IRilogEventItem, IRilogMessageConfig, ISelfServer, TDeviceInfo, TExternalInfoMeta, TRilogCaptureConfig, TRilogPushRequest, TRilogPushResponse } from '@rilog-development/rilog-shared';

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

export type TRilogInitConfig = TRilogCaptureConfig &
    Partial<{
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

export interface IDeployServerConfig {
    key: string; // app key for Rilog cloud backend
}

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
