import { initRequest } from '../api';
import AxiosAdapter from '../feature/interceptors/axios/adapter';
import { IAxiosAdapter } from '../feature/interceptors/axios/types';
import { initFetchInterception } from '../feature/interceptors/fetch';
import FetchAdapter from '../feature/interceptors/fetch/adapter';
import { IFetchAdapter } from '../feature/interceptors/fetch/types';
import { IRilog, IRilogRequest, IRilogResponse, TRilogInit, TRilogPushRequest, TRilogPushResponse, TRilogState } from '../types';
import { IRilogInterceptror } from '../types/interceptor';
import { getUserUniqToken } from '../utils';
import { getExternalInfo } from '../utils/browser';
import { logMethods } from '../utils/logger';
import RilogInterceptor from './interceptor';

class Rilog implements IRilog {
    private interceptor: IRilogInterceptror | null = null;
    private axiosAdapter: IAxiosAdapter;
    private fetchAdapter: IFetchAdapter;

    public state: TRilogState;

    constructor(state: TRilogState) {
        this.state = state;
        this.axiosAdapter = new AxiosAdapter();
        this.fetchAdapter = new FetchAdapter();
    }

    @logMethods('IRilog')
    async init({ key, config }: TRilogInit) {
        /**
         * Initialize interceptor
         * Set default config from client to interceptor for relevant request filtering
         */
        this.interceptor = new RilogInterceptor(config || null);

        /**
         * Init fetch interception
         */
        !config?.disableFetchInterceptor && initFetchInterception(this.interceptFetchRequest.bind(this), this.interceptFetchResponse.bind(this));

        /**
         * Generate unique client token
         */
        const token = getUserUniqToken();

        /**
         * Save appId (app key) to the state
         */
        this.updateState({ key });

        /**
         * Get some browser information
         */
        const externalInfo = getExternalInfo();

        const data = await initRequest({ uToken: token, appId: key, externalInfo });

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

        if (!axiosPreparedRequest) return;

        this.onRequest(axiosPreparedRequest);
    }

    async interceptResponseAxios(data: TRilogPushResponse) {
        if (this.state.init && !this.state.recording) return;
        /**
         * Prepare response from axios
         */
        const axiosPreparedResponse = this.axiosAdapter.getResponse(data);

        if (!axiosPreparedResponse) return;

        await this.onResponse(axiosPreparedResponse);
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

        if (!fetchPreparedRequest) return;

        this.onRequest(fetchPreparedRequest);
    }

    @logMethods('IRilog')
    private async interceptFetchResponse(data: TRilogPushResponse) {
        if (this.state.init && !this.state.recording) return;
        /**
         * Prepare response from fetch
         */
        const fetchPreparedResponse = this.fetchAdapter.getResponse(data);

        if (!fetchPreparedResponse) return;

        await this.onResponse(fetchPreparedResponse);
    }

    @logMethods('IRilog', true)
    private onRequest(request: IRilogRequest) {
        /**
         * Prepare full request with filled additional info
         */
        const preparedRequest = this.interceptor?.prepareRequest(request);

        if (!preparedRequest) return;

        /**
         * Save prepared request (after filtering) to store
         */
        this.updateState({
            request: preparedRequest || null,
        });
    }

    @logMethods('IRilog', false)
    private async onResponse(response: IRilogResponse) {
        /**
         * Prepare full response with filled additional info
         */
        const preparedResponse = await this.interceptor?.prepareResponse(response || {}, this.state.request);

        if (!preparedResponse) return;

        /**
         * Clear request after pushing full request data to store
         */
        this.updateState({
            request: null,
        });
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
