import { initRequest } from "../api";
import AxiosAdapter from "../feature/interceptors/axios/adapter";
import { IAxiosAdapter, IAxiosInterceptor } from "../feature/interceptors/axios/types";
import { IRilog, IRilogRequestTimed, TRilogInit, TRilogPushRequest, TRilogPushResponse, TRilogState } from "../types";
import { IRilogInterceptror } from "../types/interceptor";
import { IRilogTimer } from "../types/timer";
import { getUserUniqToken } from "../utils";
import { getExternalInfo } from "../utils/browser";
import RilogInterceptor from "./interceptror";
import RilogTimer from "./timer";

class Rilog implements IRilog {

   
    private interceptor: IRilogInterceptror | null = null;
    private axiosAdapter: IAxiosAdapter;

    public state: TRilogState;

    constructor (state: TRilogState) {
        this.state = state;
        this.axiosAdapter = new AxiosAdapter();
    }

    async init({ key, config}: TRilogInit){
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
        this.interceptor = new RilogInterceptor(config || null);
    }

    interceptRequestAxios(data: TRilogPushRequest) {
        /**
         * Prepare request from axios
         */
        const axiosPreparedRequest = this.axiosAdapter.getRequest(data);

        if (!axiosPreparedRequest) return;

        /**
         * Prepare full request with filled additional info
         */
        const preparedRequest = this.interceptor?.prepareRequest(axiosPreparedRequest);

        if (!preparedRequest) return;

        /**
         * Save prepared request (after filtering) to store
         */
        this.updateState({
            request: preparedRequest || null
        })
    }

    async interceptResponseAxios(data: TRilogPushResponse) {
         /**
         * Prepare response from axios
         */
        const axiosPreparedResponse = this.axiosAdapter.getResponse(data);

        /**
         * Prepare full response with filled additional info
         */
        const preparedResponse = await this.interceptor?.prepareResponse(axiosPreparedResponse || {}, this.state.request);

        if (!preparedResponse) return;

        /**
         * Clear request after pushing full request data to store
         */
        this.updateState({
            request: null
        });
    }

    /**
     * Update some part of state
     * @param state {object}
     */
    private updateState(state: Partial<TRilogState>) {
        const updatedState = {
            ...this.state,
            ...state
        }

        this.state = updatedState;
    }
}

export default Rilog;