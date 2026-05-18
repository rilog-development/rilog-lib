import { saveEventsCustom, saveEventsToRilog } from '../api/save';
import { initRequest } from '../api/init';

const mockFetch = jest.fn();
global.fetch = mockFetch;

const jsonResponse = (body: object, status = 200) =>
    Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) } as Response);

beforeEach(() => {
    mockFetch.mockReset();
});

describe('saveEventsToRilog', () => {
    it('POSTs to /connection/send with Authorization header', async () => {
        mockFetch.mockReturnValue(jsonResponse({ result: 'SUCCESS' }));
        await saveEventsToRilog('encrypted-data', 'my-token');
        expect(mockFetch).toHaveBeenCalledTimes(1);
        const [url, opts] = mockFetch.mock.calls[0];
        expect(url).toContain('/connection/send');
        expect(opts.method).toBe('POST');
        expect(opts.headers.Authorization).toBe('Bearer my-token');
    });

    it('sends eventsData in the body', async () => {
        mockFetch.mockReturnValue(jsonResponse({ result: 'SUCCESS' }));
        await saveEventsToRilog('payload-123', 'tok');
        const body = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(body.eventsData).toBe('payload-123');
    });

    it('returns the parsed JSON response', async () => {
        mockFetch.mockReturnValue(jsonResponse({ result: 'SUCCESS' }));
        const result = await saveEventsToRilog('d', 'tok');
        expect(result).toEqual({ result: 'SUCCESS' });
    });

    it('returns undefined and logs on fetch error', async () => {
        const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
        mockFetch.mockRejectedValue(new Error('network'));
        const result = await saveEventsToRilog('d', 'tok');
        expect(result).toBeUndefined();
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });
});

describe('saveEventsCustom', () => {
    it('POSTs to the provided URL', async () => {
        mockFetch.mockReturnValue(jsonResponse({ result: 'SUCCESS' }));
        await saveEventsCustom({ data: '{}', url: 'http://localhost:3030/api/events/save' });
        expect(mockFetch.mock.calls[0][0]).toBe('http://localhost:3030/api/events/save');
        expect(mockFetch.mock.calls[0][1].method).toBe('POST');
    });

    it('sets Content-Type application/json', async () => {
        mockFetch.mockReturnValue(jsonResponse({ result: 'SUCCESS' }));
        await saveEventsCustom({ data: '{}', url: 'http://localhost/save' });
        const headers: Headers = mockFetch.mock.calls[0][1].headers;
        expect(headers.get('Content-Type')).toBe('application/json');
    });

    it('appends custom headers when provided', async () => {
        mockFetch.mockReturnValue(jsonResponse({ result: 'SUCCESS' }));
        await saveEventsCustom({ data: '{}', url: 'http://localhost/save', headers: { 'X-Api-Key': 'secret' } });
        const headers: Headers = mockFetch.mock.calls[0][1].headers;
        expect(headers.get('X-Api-Key')).toBe('secret');
    });

    it('returns undefined and logs on fetch error', async () => {
        const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
        mockFetch.mockRejectedValue(new Error('timeout'));
        const result = await saveEventsCustom({ data: '{}', url: 'http://localhost/save' });
        expect(result).toBeUndefined();
        spy.mockRestore();
    });
});

describe('initRequest', () => {
    it('resolves immediately with recording:true when no deployServer', async () => {
        const result = await initRequest({ data: {} as any, config: undefined });
        expect(result.recording).toBe(true);
        expect(result.access_token).toBe('');
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('resolves immediately when config has no deployServer key', async () => {
        const result = await initRequest({ data: {} as any, config: { localServer: { url: 'http://localhost', appName: 'test' } } });
        expect(result.recording).toBe(true);
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('POSTs to /connection/init when deployServer is set', async () => {
        mockFetch.mockReturnValue(jsonResponse({ access_token: 'tok', recording: true }));
        await initRequest({ data: { uToken: 'u', appId: 'k', externalInfo: {} as any, deviceInfo: {} as any }, config: { deployServer: { key: 'k' } } });
        expect(mockFetch.mock.calls[0][0]).toContain('/connection/init');
    });

    it('returns parsed response from /connection/init', async () => {
        mockFetch.mockReturnValue(jsonResponse({ access_token: 'abc', recording: true }));
        const result = await initRequest({ data: { uToken: 'u', appId: 'k', externalInfo: {} as any, deviceInfo: {} as any }, config: { deployServer: { key: 'k' } } });
        expect(result.access_token).toBe('abc');
    });

    it('returns undefined and logs on fetch error', async () => {
        const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
        mockFetch.mockRejectedValue(new Error('fail'));
        const result = await initRequest({ data: {} as any, config: { deployServer: { key: 'k' } } });
        expect(result).toBeUndefined();
        spy.mockRestore();
    });
});
