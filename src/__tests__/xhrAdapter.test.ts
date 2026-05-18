/**
 * @jest-environment jsdom
 */
import XHRAdapter from '../feature/interceptors/xhr/adapter';

describe('XHRAdapter', () => {
    let adapter: XHRAdapter;

    beforeEach(() => {
        adapter = new XHRAdapter();
    });

    describe('getRequest', () => {
        it('returns null when url is missing', () => {
            expect(adapter.getRequest({ url: '', method: 'GET', headers: {} })).toBeNull();
        });

        it('returns null when method is missing', () => {
            expect(adapter.getRequest({ url: 'https://api.example.com', method: '', headers: {} })).toBeNull();
        });

        it('returns request with url, method and headers', () => {
            const result = adapter.getRequest({ url: 'https://api.example.com/data', method: 'GET', headers: { 'X-Custom': 'value' } });
            expect(result?.url).toBe('https://api.example.com/data');
            expect(result?.method).toBe('GET');
            expect(result?.headers).toEqual({ 'X-Custom': 'value' });
        });

        it('sets location to null origin/href', () => {
            const result = adapter.getRequest({ url: 'https://api.example.com', method: 'GET', headers: {} });
            expect(result?.location).toEqual({ origin: null, href: null });
        });

        it('serializes null body to null', () => {
            const result = adapter.getRequest({ url: 'https://api.example.com', method: 'POST', headers: {}, body: null });
            expect(result?.data).toBeNull();
        });

        it('parses JSON string body', () => {
            const result = adapter.getRequest({ url: 'https://api.example.com', method: 'POST', headers: {}, body: '{"key":"value"}' });
            expect(result?.data).toEqual({ key: 'value' });
        });

        it('keeps non-JSON string body as string', () => {
            const result = adapter.getRequest({ url: 'https://api.example.com', method: 'POST', headers: {}, body: 'plain text' });
            expect(result?.data).toBe('plain text');
        });

        it('serializes FormData body to key-value object', () => {
            const form = new FormData();
            form.append('name', 'Alice');
            form.append('age', '30');
            const result = adapter.getRequest({ url: 'https://api.example.com', method: 'POST', headers: {}, body: form });
            expect(result?.data).toEqual({ name: 'Alice', age: '30' });
        });

        it('serializes File in FormData as descriptor string', () => {
            const form = new FormData();
            const file = new File(['content'], 'test.txt', { type: 'text/plain' });
            form.append('upload', file);
            const result = adapter.getRequest({ url: 'https://api.example.com', method: 'POST', headers: {}, body: form });
            expect(result?.data.upload).toContain('[File: test.txt');
        });

        it('serializes Blob body as descriptor string', () => {
            const blob = new Blob(['data'], { type: 'text/plain' });
            const result = adapter.getRequest({ url: 'https://api.example.com', method: 'POST', headers: {}, body: blob });
            expect(result?.data).toContain('[Blob:');
            expect(result?.data).toContain('text/plain');
        });

        it('serializes ArrayBuffer body as descriptor string', () => {
            const buffer = new ArrayBuffer(16);
            const result = adapter.getRequest({ url: 'https://api.example.com', method: 'POST', headers: {}, body: buffer });
            expect(result?.data).toBe('[ArrayBuffer: 16b]');
        });
    });

    describe('getResponse', () => {
        it('returns null when url is missing', () => {
            expect(adapter.getResponse({ url: '', data: '{}', status: 200 })).toBeNull();
        });

        it('returns response with parsed JSON data', () => {
            const result = adapter.getResponse({ url: 'https://api.example.com/data', data: '{"id":1}', status: 200 });
            expect(result?.data).toEqual({ id: 1 });
            expect(result?.status).toBe('200');
            expect(result?.url).toBe('https://api.example.com/data');
        });

        it('keeps data as string when JSON.parse fails', () => {
            const result = adapter.getResponse({ url: 'https://api.example.com/data', data: 'not json', status: 200 });
            expect(result?.data).toBe('not json');
        });

        it('converts status to string', () => {
            const result = adapter.getResponse({ url: 'https://api.example.com/data', data: '{}', status: 404 });
            expect(result?.status).toBe('404');
        });
    });
});
