import FetchAdapter from '../feature/interceptors/fetchInterceptor/adapter';

describe('FetchAdapter', () => {
    let adapter: FetchAdapter;

    beforeEach(() => {
        adapter = new FetchAdapter();
    });

    describe('getRequest', () => {
        it('returns null when url is empty', () => {
            expect(adapter.getRequest({ url: '', options: { method: 'POST' } })).toBeNull();
        });

        it('defaults method to GET when options has no method', () => {
            const result = adapter.getRequest({ url: 'https://api.example.com/data', options: {} });
            expect(result?.method).toBe('GET');
        });

        it('uses method from options when provided', () => {
            const result = adapter.getRequest({ url: 'https://api.example.com/data', options: { method: 'POST' } });
            expect(result?.method).toBe('POST');
        });

        it('uses body data when method is provided', () => {
            const result = adapter.getRequest({ url: 'https://api.example.com/data', options: { method: 'POST', data: { key: 'value' } } });
            expect(result?.data).toEqual({ key: 'value' });
        });

        it('uses query params as data when no method in options', () => {
            const result = adapter.getRequest({ url: 'https://api.example.com/data?foo=bar&baz=1', options: {} });
            expect(result?.data).toEqual({ foo: 'bar', baz: '1' });
        });

        it('uses empty object as data when no method and no query params', () => {
            const result = adapter.getRequest({ url: 'https://api.example.com/data', options: {} });
            expect(result?.data).toEqual({});
        });

        it('uses headers from options', () => {
            const result = adapter.getRequest({ url: 'https://api.example.com/data', options: { method: 'GET', headers: { Authorization: 'Bearer token' } } });
            expect(result?.headers).toEqual({ Authorization: 'Bearer token' });
        });

        it('defaults to empty headers when not provided', () => {
            const result = adapter.getRequest({ url: 'https://api.example.com/data', options: {} });
            expect(result?.headers).toEqual({});
        });

        it('sets location to null origin/href', () => {
            const result = adapter.getRequest({ url: 'https://api.example.com/data', options: { method: 'GET' } });
            expect(result?.location).toEqual({ origin: null, href: null });
        });
    });

    describe('getResponse', () => {
        it('returns null for an empty object', () => {
            expect(adapter.getResponse({})).toBeNull();
        });

        it('returns response with data, status and url', () => {
            const result = adapter.getResponse({ data: { ok: true }, status: 200, url: 'https://api.example.com/data' });
            expect(result).toEqual({ data: { ok: true }, status: 200, url: 'https://api.example.com/data' });
        });

        it('falls back to "No data." when data is missing', () => {
            const result = adapter.getResponse({ status: 200, url: 'https://api.example.com/data' });
            expect(result?.data).toBe('No data.');
        });

        it('falls back to null status when status is missing', () => {
            const result = adapter.getResponse({ data: 'ok', url: 'https://api.example.com/data' });
            expect(result?.status).toBeNull();
        });

        it('falls back to empty string url when url is missing', () => {
            const result = adapter.getResponse({ data: 'ok', status: 200 });
            expect(result?.url).toBe('');
        });
    });
});
