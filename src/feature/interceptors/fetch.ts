import { TRilogPushRequest, TRilogPushResponse } from '../../types';
import { fetchAdapterRequest, fetchAdapterResponse } from '../../adapters/fetch-adapter';
import { pushRequest, pushResponse } from '../requests';

const fetchInterceptor = {
    init: () => {
        const { fetch: originalFetch } = window;

        window.fetch = async (url, options) => {
            fetchInterceptor.onRequest({ url, options });

            const response = await originalFetch(url, options);

            const clonedResponse = response.clone();

            clonedResponse.text().then((data) => {
                fetchInterceptor.onResponse({
                    status: response.status,
                    data,
                });
            });

            return response;
        };
    },
    onRequest: (data: TRilogPushRequest) => {
        const preparedRequest = fetchAdapterRequest(data);
        console.log('[onRequest] preparedRequest', preparedRequest);

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
