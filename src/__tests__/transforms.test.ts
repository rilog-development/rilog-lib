import { parseStackTrace, getQueryParamsFromUrl } from '../utils/transforms';

describe('parseStackTrace', () => {
    it('removes the "Error" header line', () => {
        const stack = 'Error: something went wrong\n    at foo (app.js:10:5)\n    at bar (app.js:20:3)';
        const result = parseStackTrace(stack);
        expect(result).not.toContain('Error: something went wrong');
    });

    it('filters out rilog-lib internal frames', () => {
        const stack = ['Error', '    at captureEvent (rilog-lib/src/core/interceptor.ts:42:5)', '    at userFunction (src/components/App.tsx:15:3)'].join('\n');
        const result = parseStackTrace(stack);
        expect(result).not.toContain('rilog-lib');
        expect(result).toContain('userFunction');
    });

    it('preserves application frames', () => {
        const stack = ['Error', '    at handleClick (src/components/Button.tsx:8:5)', '    at dispatchEvent (react-dom.js:100:10)'].join('\n');
        const result = parseStackTrace(stack);
        expect(result).toContain('handleClick');
        expect(result).toContain('dispatchEvent');
    });

    it('returns empty string when all frames are from rilog-lib', () => {
        const stack = ['Error', '    at rilog-lib/interceptor.ts:1:1', '    at rilog-lib/core.ts:2:2'].join('\n');
        const result = parseStackTrace(stack);
        expect(result).toBe('');
    });

    it('trims surrounding whitespace from the result', () => {
        const stack = 'Error\n    at foo (app.js:1:1)';
        const result = parseStackTrace(stack);
        expect(result).toBe(result.trim());
    });
});

describe('getQueryParamsFromUrl', () => {
    it('returns null for a URL with no query string', () => {
        expect(getQueryParamsFromUrl('https://api.example.com/users')).toBeNull();
    });

    it('returns null for a URL ending with "?"', () => {
        expect(getQueryParamsFromUrl('https://api.example.com/users?')).toBeNull();
    });

    it('parses a single query parameter', () => {
        expect(getQueryParamsFromUrl('https://api.example.com/users?id=42')).toEqual({ id: '42' });
    });

    it('parses multiple query parameters', () => {
        expect(getQueryParamsFromUrl('/search?q=hello&page=2&sort=asc')).toEqual({ q: 'hello', page: '2', sort: 'asc' });
    });

    it('handles encoded characters in values', () => {
        const result = getQueryParamsFromUrl('/search?q=hello%20world');
        expect(result).toEqual({ q: 'hello world' });
    });

    it('returns null for a plain path with no question mark', () => {
        expect(getQueryParamsFromUrl('/api/v1/users')).toBeNull();
    });
});
