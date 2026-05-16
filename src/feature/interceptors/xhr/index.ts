import { ISelfServer } from '../../../types';
import { isLibruarySensetiveRequest, isUrlIgnored } from '../../../utils/filters';
import { TRilogXHRRequest, TRilogXHRResponse } from './types';

const initXHRInterception = (onRequest: (data: TRilogXHRRequest) => void, onResponse: (data: TRilogXHRResponse) => void, selfServer?: ISelfServer) => {
    const OriginalXHR = window.XMLHttpRequest;

    (window as any).XMLHttpRequest = function XHRProxy(this: XMLHttpRequest) {
        const xhr: XMLHttpRequest = new OriginalXHR();
        const capturedHeaders: Record<string, string> = {};
        let capturedUrl = '';
        let capturedMethod = '';

        const originalOpen = xhr.open.bind(xhr);
        const originalSend = xhr.send.bind(xhr);
        const originalSetRequestHeader = xhr.setRequestHeader.bind(xhr);

        (xhr as any).open = (method: string, url: string | URL, async?: boolean, user?: string | null, password?: string | null) => {
            capturedMethod = method;
            capturedUrl = url instanceof URL ? url.href : String(url);
            return originalOpen(method, url as string, async ?? true, user, password);
        };

        (xhr as any).setRequestHeader = (name: string, value: string) => {
            capturedHeaders[name] = value;
            return originalSetRequestHeader(name, value);
        };

        (xhr as any).send = (body?: Document | XMLHttpRequestBodyInit | null) => {
            const isSelfServerRequest = selfServer ? isUrlIgnored(capturedUrl, [selfServer.url]) : false;
            const isSensitive = isLibruarySensetiveRequest(capturedUrl) || isSelfServerRequest;

            if (!isSensitive) {
                onRequest({ url: capturedUrl, method: capturedMethod, headers: { ...capturedHeaders }, body });
            }

            xhr.addEventListener('loadend', () => {
                if (!isSensitive) {
                    onResponse({ url: capturedUrl, status: xhr.status, data: xhr.responseText });
                }
            });

            xhr.addEventListener('error', () => {
                if (!isSensitive) {
                    onResponse({ url: capturedUrl, status: 'network_error', data: 'XHR network error' });
                }
            });

            xhr.addEventListener('timeout', () => {
                if (!isSensitive) {
                    onResponse({ url: capturedUrl, status: 'timeout', data: 'XHR request timeout' });
                }
            });

            return originalSend(body);
        };

        return xhr;
    };

    (window as any).XMLHttpRequest.prototype = OriginalXHR.prototype;
};

export { initXHRInterception };
