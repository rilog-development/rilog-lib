import { initRequest } from '../api';
import AxiosAdapter from '../feature/interceptors/axios/adapter';
import { IAxiosAdapter } from '../feature/interceptors/axios/types';
import FetchAdapter from '../feature/interceptors/fetch/adapter';
import { IFetchAdapter } from '../feature/interceptors/fetch/types';
import { IRilog, IRilogRequest, IRilogResponse, TRilogInit, TRilogPushRequest, TRilogPushResponse, TRilogState } from '../types';
import { IRilogInterceptror } from '../types/interceptor';
import { getUserUniqToken } from '../utils';
import { getExternalInfo } from '../utils/browser';
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

    async init({ key, config }: TRilogInit) {
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
         * Got interceptor config from client
         */
        this.interceptor = new RilogInterceptor(config || null, data.salt, data.access_token);

        /**
         * Init fetch interception
         */
        // !config?.disableFetchInterceptor && initFetchInterception(this.interceptFetchRequest, this.interceptFetchResponse);
    }

    /**
     * Axios interception methods
     */

    interceptRequestAxios(data: TRilogPushRequest) {
        console.log('[interceptRequestAxios] data ', data);
        if (this.state.init && !this.state.recording) return;
        /**
         * Prepare request from axios
         */
        const axiosPreparedRequest = this.axiosAdapter.getRequest(data);

        console.log('[interceptRequestAxios] axiosPreparedRequest ', axiosPreparedRequest);

        if (!axiosPreparedRequest) return;

        this.onRequest(axiosPreparedRequest);
    }

    async interceptResponseAxios(data: TRilogPushResponse) {
        if (!this.state.recording) return;
        /**
         * Prepare response from axios
         */
        const axiosPreparedResponse = this.axiosAdapter.getResponse(data);

        console.log('[interceptResponseAxios] axiosPreparedResponse ', axiosPreparedResponse);

        if (!axiosPreparedResponse) return;

        await this.onResponse(axiosPreparedResponse);
    }

    /**
     * Fetch interception methods
     */

    private interceptFetchRequest(data: TRilogPushRequest) {
        console.log('[interceptFetchRequest] data ', data);

        if (!this.state.recording) return;
        /**
         * Prepare request from fetch
         */
        const fetchPreparedRequest = this.fetchAdapter.getRequest(data);

        console.log('[interceptFetchRequest] fetchPreparedRequest ', fetchPreparedRequest);

        if (!fetchPreparedRequest) return;

        this.onRequest(fetchPreparedRequest);
    }

    private async interceptFetchResponse(data: TRilogPushResponse) {
        console.log('[interceptFetchResponse] data ', data);
        if (!this.state.recording) return;
        /**
         * Prepare response from fetch
         */
        const fetchPreparedResponse = this.fetchAdapter.getResponse(data);

        console.log('[interceptFetchResponse] fetchPreparedResponse ', fetchPreparedResponse);

        if (!fetchPreparedResponse) return;

        await this.onResponse(fetchPreparedResponse);
    }

    private onRequest(request: IRilogRequest) {
        console.log('[onRequest] request ', request);
        /**
         * Prepare full request with filled additional info
         */
        const preparedRequest = this.interceptor?.prepareRequest(request);

        console.log('[onRequest] preparedRequest ', preparedRequest);

        if (!preparedRequest) return;

        /**
         * Save prepared request (after filtering) to store
         */
        this.updateState({
            request: preparedRequest || null,
        });
    }

    private async onResponse(response: IRilogResponse) {
        console.log('[onResponse] response ', response);
        /**
         * Prepare full response with filled additional info
         */
        const preparedResponse = await this.interceptor?.prepareResponse(response || {}, this.state.request);

        console.log('[onResponse] preparedResponse ', preparedResponse);

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
