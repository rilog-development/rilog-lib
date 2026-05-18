import AxiosAdapter from '../feature/interceptors/axios/adapter';

describe('AxiosAdapter', () => {
    let adapter: AxiosAdapter;

    beforeEach(() => {
        adapter = new AxiosAdapter();
    });

    describe('getRequest', () => {
        it('returns null when url is missing', () => {
            expect(adapter.getRequest({ method: 'GET', headers: { 'Content-Type': 'application/json' } })).toBeNull();
        });

        it('returns null when method is missing', () => {
            expect(adapter.getRequest({ url: 'https://api.example.com/data', headers: { 'Content-Type': 'application/json' } })).toBeNull();
        });

        it('defaults to empty headers when not provided', () => {
            const result = adapter.getRequest({ url: 'https://api.example.com/data', method: 'GET' });
            expect(result?.headers).toEqual({});
        });

        it('returns full request when all fields are provided', () => {
            const result = adapter.getRequest({
                url: 'https://api.example.com/data',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                data: { name: 'test' },
            });
            expect(result?.url).toBe('https://api.example.com/data');
            expect(result?.method).toBe('POST');
            expect(result?.headers).toEqual({ 'Content-Type': 'application/json' });
            expect(result?.data).toEqual({ name: 'test' });
        });

        it('merges params into data', () => {
            const result = adapter.getRequest({
                url: 'https://api.example.com/data',
                method: 'GET',
                headers: {},
                data: { existing: 'value' },
                params: { page: 1, limit: 10 },
            });
            expect(result?.data).toEqual({ existing: 'value', page: 1, limit: 10 });
        });

        it('uses only params as data when no data field', () => {
            const result = adapter.getRequest({
                url: 'https://api.example.com/data',
                method: 'GET',
                headers: {},
                params: { search: 'query' },
            });
            expect(result?.data).toEqual({ search: 'query' });
        });

        it('sets location to null origin/href', () => {
            const result = adapter.getRequest({ url: 'https://api.example.com', method: 'GET', headers: {} });
            expect(result?.location).toEqual({ origin: null, href: null });
        });
    });

    describe('getResponse', () => {
        it('returns null for an empty object', () => {
            expect(adapter.getResponse({})).toBeNull();
        });

        it('returns error response when status does not start with 2', () => {
            const result = adapter.getResponse({
                status: 404,
                response: { data: { error: 'Not found' } },
                config: { url: 'https://api.example.com/data' },
            });
            expect(result?.data).toEqual({ error: 'Not found' });
            expect(result?.status).toBe('404');
            expect(result?.url).toBe('https://api.example.com/data');
        });

        it('returns error response for 500 status', () => {
            const result = adapter.getResponse({
                status: 500,
                response: { data: 'Internal Server Error' },
                config: { url: 'https://api.example.com/data' },
            });
            expect(result?.status).toBe('500');
        });

        it('returns success response when status starts with 2 and data exists', () => {
            const result = adapter.getResponse({
                status: 200,
                data: { id: 1, name: 'test' },
                config: { url: 'https://api.example.com/data' },
                response: { status: 200 },
            });
            expect(result?.data).toEqual({ id: 1, name: 'test' });
            expect(result?.url).toBe('https://api.example.com/data');
        });

        it('prefers response.status over status for success response', () => {
            const result = adapter.getResponse({
                status: 200,
                data: { ok: true },
                config: { url: 'https://api.example.com/data' },
                response: { status: 201 },
            });
            expect(result?.status).toBe('201');
        });

        it('falls back to status when response.status is missing', () => {
            const result = adapter.getResponse({
                status: 200,
                data: { ok: true },
                config: { url: 'https://api.example.com/data' },
                response: {},
            });
            expect(result?.status).toBe('200');
        });

        it('returns null for 2xx when data key is absent', () => {
            // JSON.stringify(undefined) returns undefined → .length is falsy → null returned
            const result = adapter.getResponse({
                status: 200,
                config: { url: 'https://api.example.com/data' },
                response: { status: 200 },
            });
            expect(result).toBeNull();
        });
    });
});
