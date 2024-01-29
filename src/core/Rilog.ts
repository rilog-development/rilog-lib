import { initRequest } from '../api';
import AxiosAdapter from '../feature/interceptors/axios/adapter';
import { IAxiosAdapter } from '../feature/interceptors/axios/types';
import { initFetchInterception } from '../feature/interceptors/fetch';
import FetchAdapter from '../feature/interceptors/fetch/adapter';
import { IFetchAdapter } from '../feature/interceptors/fetch/types';
import { IRilogMessageConfig } from '../feature/interceptors/message/types';
import { IRilog, TRilogExtensions, TRilogInit, TRilogPushRequest, TRilogPushResponse, TRilogState } from '../types';
import { IRilogInterceptror } from '../types/interceptor';
import { getUserUniqToken } from '../utils';
import { getExternalInfo } from '../utils/browser';
import { logMethods } from '../utils/logger';
import RilogInterceptor from './interceptor';

class Rilog implements IRilog {
    private interceptor: IRilogInterceptror | null = null;
    private axiosAdapter: IAxiosAdapter;
    private fetchAdapter: IFetchAdapter;

    private state: TRilogState;

    constructor(state: TRilogState, extensions?: TRilogExtensions) {
        this.state = state;
        this.axiosAdapter = new AxiosAdapter();
        this.fetchAdapter = new FetchAdapter();

        /**
         * Check if extension is exist and starts it.
         */
        if (extensions?.interactivePanel) {
            extensions.interactivePanel.build();
        }
    }

    @logMethods('IRilog')
    async init({ key, config }: TRilogInit) {
        /**
         * Initialize interceptor
         * Set default config from client to interceptor for relevant request filtering
         */
        this.interceptor = new RilogInterceptor(config || null);

        /**
         * Init fetch interception.
         * (Can be disabled from config).
         */
        !config?.disableFetchInterceptor && initFetchInterception(this.interceptFetchRequest.bind(this), this.interceptFetchResponse.bind(this));

        /**
         * Generate unique client token
         */
        const uToken = getUserUniqToken();

        /**
         * Save appId (app key) to the state
         */
        this.updateState({ key });

        /**
         * Get some browser information
         */
        const externalInfo = getExternalInfo();

        const data = await initRequest({ data: { uToken, appId: key, externalInfo }, config });

        this.updateState({
            token: data.access_token,
            salt: data.salt,
            recording: data.recording,
            init: true,
            config: config || null,
        });

        /**
         * Set salt and acess token to interceptop for pushing it to backend store
         */
        this.interceptor.salt = data.salt;
        this.interceptor.token = data.access_token;
        this.interceptor.init = true;
        this.interceptor.uToken = uToken;
    }

    /**
     * Axios interception methods
     */

    @logMethods('IRilog')
    interceptRequestAxios(data: TRilogPushRequest) {
        if (this.state.init && !this.state.recording) return;
        /**
         * Prepare request from axios
         */
        const axiosPreparedRequest = this.axiosAdapter.getRequest(data);

        if (!axiosPreparedRequest || !this.interceptor) return;

        this.interceptor.onRequest(axiosPreparedRequest);
    }

    async interceptResponseAxios(data: TRilogPushResponse) {
        if (this.state.init && !this.state.recording) return;
        /**
         * Prepare response from axios
         */
        const axiosPreparedResponse = this.axiosAdapter.getResponse(data);

        if (!axiosPreparedResponse || !this.interceptor) return;

        await this.interceptor.onResponse(axiosPreparedResponse);
    }

    /**
     * Intercept custom user messages/data
     */
    @logMethods('IRilog')
    saveData<T>(data: T, config: IRilogMessageConfig): void {
        this.interceptor?.onSaveData(data, config);
    }

    /**
     * Fetch interception methods
     */
    @logMethods('IRilog')
    private interceptFetchRequest(data: TRilogPushRequest) {
        if (this.state.init && !this.state.recording) return;
        /**
         * Prepare request from fetch
         */
        const fetchPreparedRequest = this.fetchAdapter.getRequest(data);

        if (!fetchPreparedRequest || !this.interceptor) return;

        this.interceptor.onRequest(fetchPreparedRequest);
    }

    @logMethods('IRilog')
    private async interceptFetchResponse(data: TRilogPushResponse) {
        if (this.state.init && !this.state.recording) return;
        /**
         * Prepare response from fetch
         */
        const fetchPreparedResponse = this.fetchAdapter.getResponse(data);

        if (!fetchPreparedResponse || !this.interceptor) return;

        await this.interceptor.onResponse(fetchPreparedResponse);
    }

    /**
     * Update some part of state
     * @param state {object}
     */
    private updateState(state: Partial<TRilogState>) {
        const updatedState = {
            ...this.state,
            ...state,
        };

        this.state = updatedState;
    }
}

export default Rilog;
