import { TRilogPushRequest, TRilogPushResponse } from '../../../types';
import { isLibruarySensetiveRequest } from '../../../utils/filters';

const initFetchInterception = (onRequest: (data: TRilogPushRequest) => void, onResponse: (data: TRilogPushResponse) => void) => {
    console.log('[initFetchInterception]');

    const { fetch: originalFetch } = window;

    window.fetch = async (url, options) => {
        const isSensetive = isLibruarySensetiveRequest(url as string);
        console.log('[initFetchInterception] isSensetive ', isSensetive, ' url ', url);

        !isSensetive && onRequest({ url, options });

        const response = await originalFetch(url, options);

        const clonedResponse = response.clone();

        clonedResponse.text().then((data) => {
            !isSensetive &&
                onResponse({
                    status: response.status,
                    data,
                });
        });

        return response;
    };
};

export { initFetchInterception };
