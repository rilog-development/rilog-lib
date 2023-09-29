import { TRilogPushRequest, TRilogPushResponse } from '../../types';
import { fetchAdapterRequest, fetchAdapterResponse } from '../../adapters/fetch-adapter';
import { pushRequest, pushResponse } from '../requests';

const fetchInterceptor = {
    init: () => {
        const { fetch: originalFetch } = window;

        window.fetch = async (...args) => {
            const [resource, config] = args;

            fetchInterceptor.onRequest({ url: resource, config });

            const response = await originalFetch(resource, config);

            fetchInterceptor.onResponse({ response, responseData: response.json() });

            return response;
        };
    },
    onRequest: (data: TRilogPushRequest) => {
        const preparedRequest = fetchAdapterRequest(data);

        if (!preparedRequest) return;

        pushRequest(preparedRequest);
    },
    onResponse: (data: TRilogPushResponse) => {
        const prepareResponse = fetchAdapterResponse(data);

        if (!prepareResponse) return;

        pushResponse(prepareResponse);
    },
};

export { fetchInterceptor };
