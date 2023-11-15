// types
import { TRilogInit, TRilogPushRequest, TRilogPushResponse } from './types';
// state
import { initState, updatePartState } from './state';
// api
import { initRequest } from './api';
// tokens
import { getUserUniqToken } from './utils';
import { getExternalInfo } from './utils/browser';
import { axiosInterceptor } from './feature/interceptors/axios';
import { fetchInterceptor } from './feature/interceptors/fetch';

/**
 * RILOG object/typed
 */

type TRilog = {
    init: (data: TRilogInit) => void;
    initFetchInterceptor: () => void;
    interceptRequestAxios: (data: TRilogPushRequest) => void;
    interceptResponseAxios: (data: TRilogPushResponse) => void;
};

const Rilog = {
    // methods
    init: async ({ key, config }: TRilogInit) => {
        initState();

        const token = getUserUniqToken();

        /**
         * Save appId (app key) to the state
         * @param key {string}
         */
        updatePartState({ key });

        const externalInfo = getExternalInfo();

        const data = await initRequest({ uToken: token, appId: key, externalInfo });

        updatePartState({
            token: data.access_token,
            salt: data.salt,
            recording: data.recording,
            init: true,
            config: config || null,
        });
    },
    initFetchInterceptor: fetchInterceptor.init,
    interceptRequestAxios: axiosInterceptor.onRequest,
    interceptResponseAxios: axiosInterceptor.onResponse,
} as TRilog;

export { Rilog };
