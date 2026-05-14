import { initRequest } from '../api';
import AxiosAdapter from '../feature/interceptors/axios/adapter';
import { IAxiosAdapter } from '../feature/interceptors/axios/types';
import { initFetchInterception } from '../feature/interceptors/fetchInterceptor';
import FetchAdapter from '../feature/interceptors/fetchInterceptor/adapter';
import { IFetchAdapter } from '../feature/interceptors/fetchInterceptor/types';
import { initXHRInterception } from '../feature/interceptors/xhr';
import XHRAdapter from '../feature/interceptors/xhr/adapter';
import { IXHRAdapter, TRilogXHRRequest, TRilogXHRResponse } from '../feature/interceptors/xhr/types';
import { IRilogMessageConfig } from '../feature/interceptors/message/types';
import { IAxiosLike, IRilog, TRilogExtensions, TRilogInit, TRilogPushRequest, TRilogPushResponse, TRilogState } from '../types';
import { IRilogInterceptror } from '../types/interceptor';
import { getUserUniqToken, updateUserUniqToken } from '../utils';
import { getExternalInfo } from '../utils/browser';
import { parseStackTrace } from '../utils/transforms';
import { logMethods } from '../utils/logger';
import RilogInterceptor from './interceptor';

class Rilog implements IRilog {
    private interceptor: IRilogInterceptror | null = null;
    private axiosAdapter: IAxiosAdapter;
    private fetchAdapter: IFetchAdapter;
    private xhrAdapter: IXHRAdapter;

    private state: TRilogState;

    constructor(state: TRilogState, extensions?: TRilogExtensions) {
        this.state = state;
        this.axiosAdapter = new AxiosAdapter();
        this.fetchAdapter = new FetchAdapter();
        this.xhrAdapter = new XHRAdapter();

        if (extensions?.interactivePanel) {
            extensions.interactivePanel.build();
        }
    }

    @logMethods('IRilog')
    async init({ key, config }: TRilogInit) {
        this.interceptor = new RilogInterceptor(config || null);

        !config?.disableFetchInterceptor && initFetchInterception(this.interceptFetchRequest.bind(this), this.interceptFetchResponse.bind(this), config?.selfServer);
        !config?.disableXHRInterceptor && initXHRInterception(this.interceptXHRRequest.bind(this), this.interceptXHRResponse.bind(this), config?.selfServer);

        const uToken = getUserUniqToken();

        key && this.updateState({ key });

        const externalInfo = getExternalInfo(config?.meta);

        const data = await initRequest({ data: { uToken, appId: key ?? '', externalInfo }, config });

        data?.newToken && updateUserUniqToken(data.newToken);

        this.updateState({
            token: data.access_token,
            recording: data.recording,
            init: true,
            config: config || null,
        });

        this.interceptor.token = data.access_token;
        this.interceptor.init = true;
        this.interceptor.uToken = data?.newToken ?? uToken;
    }

    @logMethods('IRilog')
    interceptRequestAxios(data: TRilogPushRequest) {
        if (this.state.init && !this.state.recording) return;
        const axiosPreparedRequest = this.axiosAdapter.getRequest(data);
        if (!axiosPreparedRequest || !this.interceptor) return;
        this.interceptor.onRequest(axiosPreparedRequest);
    }

    async interceptResponseAxios(data: TRilogPushResponse) {
        if (this.state.init && !this.state.recording) return;
        const axiosPreparedResponse = this.axiosAdapter.getResponse(data);
        if (!axiosPreparedResponse || !this.interceptor) return;
        await this.interceptor.onResponse(axiosPreparedResponse);
    }

    @logMethods('IRilog')
    logData<T>(data: T, config: IRilogMessageConfig): void {
        const stackTrace = parseStackTrace(new Error().stack || '');
        this.interceptor?.onLogData(data, config, stackTrace);
    }

    @logMethods('IRilog')
    private interceptFetchRequest(data: TRilogPushRequest) {
        if (this.state.init && !this.state.recording) return;
        const fetchPreparedRequest = this.fetchAdapter.getRequest(data);
        if (!fetchPreparedRequest || !this.interceptor) return;
        this.interceptor.onRequest(fetchPreparedRequest);
    }

    @logMethods('IRilog')
    private async interceptFetchResponse(data: TRilogPushResponse) {
        if (this.state.init && !this.state.recording) return;
        const fetchPreparedResponse = this.fetchAdapter.getResponse(data);
        if (!fetchPreparedResponse || !this.interceptor) return;
        await this.interceptor.onResponse(fetchPreparedResponse);
    }

    @logMethods('IRilog')
    private interceptXHRRequest(data: TRilogXHRRequest) {
        if (this.state.init && !this.state.recording) return;
        const xhrPreparedRequest = this.xhrAdapter.getRequest(data);
        if (!xhrPreparedRequest || !this.interceptor) return;
        this.interceptor.onRequest(xhrPreparedRequest);
    }

    @logMethods('IRilog')
    private async interceptXHRResponse(data: TRilogXHRResponse) {
        if (this.state.init && !this.state.recording) return;
        const xhrPreparedResponse = this.xhrAdapter.getResponse(data);
        if (!xhrPreparedResponse || !this.interceptor) return;
        await this.interceptor.onResponse(xhrPreparedResponse);
    }

    wrapAxios<T extends IAxiosLike>(instance: T): T {
        instance.interceptors.request.use((config) => {
            this.interceptRequestAxios(config);
            return config;
        });

        instance.interceptors.response.use(
            (response) => {
                this.interceptResponseAxios(response);
                return response;
            },
            (error) => {
                if (error?.response) {
                    this.interceptResponseAxios(error.response);
                }
                return Promise.reject(error);
            },
        );

        return instance;
    }

    private updateState(state: Partial<TRilogState>) {
        this.state = { ...this.state, ...state };
    }
}

export default Rilog;
