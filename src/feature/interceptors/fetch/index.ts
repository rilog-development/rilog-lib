import { ILocalServerConfig, ISelfServer, TRilogPushRequest, TRilogPushResponse } from '../../../types';
import { isLibruarySensetiveRequest, isUrlIgnored } from '../../../utils/filters';

const initFetchInterception = (onRequest: (data: TRilogPushRequest) => void, onResponse: (data: TRilogPushResponse) => void, selfServer?: ISelfServer) => {
    const { fetch: originalFetch } = window;

    window.fetch = async (url, options) => {
        const isSelfServerRequest = selfServer && url ? isUrlIgnored(url.toString(), [selfServer.url]) : false;
        const isSensitive = isLibruarySensetiveRequest(url.toString() as string) || isSelfServerRequest;

        !isSensitive && onRequest({ url, options });

        const response = await originalFetch(url, options);

        const clonedResponse = response.clone();

        clonedResponse.text().then((data) => {
            !isSensitive &&
                onResponse({
                    status: response.status,
                    data,
                    url,
                });
        });

        return response;
    };
};

export { initFetchInterception };
