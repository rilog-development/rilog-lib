import { TRilogPushRequest, TRilogPushResponse } from '../../types';
import { fetchAdapterRequest, fetchAdapterResponse } from '../../adapters/fetch-adapter';
import { pushRequest } from '../requests';
import { register } from 'fetch-intercept';

const fetchInterceptor = {
    init: () => {
        register({
            request: (url, config) => {
                // Modify the url or config here
                fetchInterceptor.onRequest([url, config]);
                return [url, config];
            },
            response: (response) => {
                // Modify the reponse object
                fetchInterceptor.onResponse(response);
                return response;
            },
        });
    },
    onRequest: (data: TRilogPushRequest) => {
        const preparedRequest = fetchAdapterRequest(data);

        if (preparedRequest) return;

        pushRequest(preparedRequest);
    },
    onResponse: (data: TRilogPushResponse) => {
        const prepareResponse = fetchAdapterResponse(data);

        if (prepareResponse) return;

        pushRequest(prepareResponse);
    },
};

export { fetchInterceptor };
