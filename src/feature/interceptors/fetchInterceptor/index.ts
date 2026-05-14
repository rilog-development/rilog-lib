import { ISelfServer, TRilogPushRequest, TRilogPushResponse } from '../../../types';
import { isLibruarySensetiveRequest, isUrlIgnored } from '../../../utils/filters';

const resolveUrl = (input: RequestInfo | URL): string => {
    if (input instanceof Request) return input.url;
    if (input instanceof URL) return input.href;
    return String(input);
};

const resolveOptions = (input: RequestInfo | URL, init?: RequestInit): RequestInit | undefined => {
    if (input instanceof Request) {
        const headers: Record<string, string> = {};
        input.headers.forEach((value, key) => {
            headers[key] = value;
        });
        return { method: input.method, headers };
    }
    return init;
};

const initFetchInterception = (onRequest: (data: TRilogPushRequest) => void, onResponse: (data: TRilogPushResponse) => void, selfServer?: ISelfServer) => {
    const { fetch: originalFetch } = window;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = resolveUrl(input);
        const options = resolveOptions(input, init);

        const isSelfServerRequest = selfServer ? isUrlIgnored(url, [selfServer.url]) : false;
        const isSensitive = isLibruarySensetiveRequest(url) || isSelfServerRequest;

        if (!isSensitive) {
            onRequest({ url, options });
        }

        let response: Response;

        try {
            response = await originalFetch(input, init);
        } catch (err) {
            if (!isSensitive) {
                onResponse({ status: 'network_error', data: String(err), url });
            }
            throw err;
        }

        response
            .clone()
            .text()
            .then((data) => {
                if (!isSensitive) {
                    onResponse({ status: response.status, data, url });
                }
            })
            .catch((err: unknown) => { console.warn('[Rilog-lib]', err); });

        return response;
    };
};

export { initFetchInterception };
