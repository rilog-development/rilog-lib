import { TRilogPushRequest, TRilogPushResponse } from '../../../types';

const initFetchInterception = (onRequest: (data: TRilogPushRequest) => void, onResponse: (data: TRilogPushResponse) => void) => {
    console.log('[initFetchInterception]');

    const { fetch: originalFetch } = window;

    window.fetch = async (url, options) => {
        onRequest({ url, options });

        const response = await originalFetch(url, options);

        const clonedResponse = response.clone();

        clonedResponse.text().then((data) => {
            console.log('[initFetchInterception] clonedResponse ', data);
            onResponse({
                status: response.status,
                data,
            });
        });

        return response;
    };
};

export { initFetchInterception };
