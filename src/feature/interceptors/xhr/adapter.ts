import { IRilogRequest, IRilogResponse } from '../../../types';
import { IXHRAdapter, TRilogXHRRequest, TRilogXHRResponse } from './types';

class XHRAdapter implements IXHRAdapter {
    getRequest(data: TRilogXHRRequest): IRilogRequest | null {
        if (!data.url || !data.method) return null;

        return {
            url: data.url,
            method: data.method,
            headers: data.headers,
            data: this.serializeBody(data.body),
            location: { origin: null, href: null },
            localStorage: null,
        };
    }

    getResponse(data: TRilogXHRResponse): IRilogResponse | null {
        if (!data.url) return null;

        let parsed: any = data.data;
        try {
            parsed = JSON.parse(data.data);
        } catch {
            // keep as string
        }

        return {
            data: parsed,
            status: String(data.status),
            url: data.url,
        };
    }

    private serializeBody(body?: Document | XMLHttpRequestBodyInit | null): any {
        if (body == null) return null;
        if (typeof body === 'string') {
            try {
                return JSON.parse(body);
            } catch {
                return body;
            }
        }
        if (body instanceof FormData) {
            const obj: Record<string, any> = {};
            body.forEach((value, key) => {
                obj[key] = value instanceof File ? `[File: ${value.name}, ${value.size}b]` : value;
            });
            return obj;
        }
        if (body instanceof Blob) return `[Blob: ${body.size}b, ${body.type}]`;
        if (body instanceof ArrayBuffer) return `[ArrayBuffer: ${body.byteLength}b]`;
        return String(body);
    }
}

export default XHRAdapter;
