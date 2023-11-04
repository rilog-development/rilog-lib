import { TRilogPushRequest, TRilogPushResponse } from '../../types';
import { fetchAdapterRequest, fetchAdapterResponse } from '../../adapters/fetch-adapter';
import { pushRequest, pushResponse } from '../requests';


const fetchInterceptor = {
    init: () => {
        window.fetch = (url, options) => {
            return fetch(url, options).then((response) => {
                // Clone the response to read it and store it in the array
                const clonedResponse = response.clone();
                const requestData = {
                    url,
                    options,
                    response: null, // Initialize response as null
                };

                fetchInterceptor.onRequest({ url: requestData.url, options: requestData.options });

                // Read the response and store it in the array
                clonedResponse.text().then((data) => {
                    fetchInterceptor.onResponse({
                        status: response.status,
                        data,
                    });
                });

                return response;
            });
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
