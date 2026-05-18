/**
 * @jest-environment jsdom
 */

jest.mock('../utils/IDBStorage', () => ({
    default: jest.fn().mockImplementation(() => ({
        push: jest.fn().mockResolvedValue(undefined),
        getAll: jest.fn().mockResolvedValue([]),
        clearByIds: jest.fn().mockResolvedValue(undefined),
        count: jest.fn().mockResolvedValue(0),
    })),
}));

jest.mock('../api', () => ({
    saveEventsCustom: jest.fn().mockResolvedValue({ result: 'success' }),
    saveEventsToRilog: jest.fn().mockResolvedValue({ result: 'success' }),
}));

import RilogInterceptor from '../core/interceptor';
import IDBStorage from '../utils/IDBStorage';
import { saveEventsCustom, saveEventsToRilog } from '../api';
import { EVENTS_ARRAY_LIMIT } from '../constants';
import { ERilogEvent } from '../types/events';
import { IRilogRequest, IRilogResponse } from '../types';

const mockSaveEventsCustom = saveEventsCustom as jest.Mock;
const mockSaveEventsToRilog = saveEventsToRilog as jest.Mock;

const silentConfig = {
    disableClickInterceptor: true,
    disableConsoleInterceptor: true,
    disableInputInterceptor: true,
};

const makeRequest = (url = 'https://api.example.com/data'): IRilogRequest => ({
    url,
    method: 'GET',
    headers: {},
    data: null,
    location: { origin: null, href: null },
    localStorage: null,
});

const makeResponse = (url = 'https://api.example.com/data'): IRilogResponse => ({
    url,
    data: { ok: true },
    status: '200',
});

const getStorage = (): ReturnType<(typeof IDBStorage.prototype)['push']> & {
    push: jest.Mock;
    getAll: jest.Mock;
    clearByIds: jest.Mock;
    count: jest.Mock;
} => {
    const results = (IDBStorage as jest.Mock).mock.results;
    return results[results.length - 1].value;
};

describe('RilogInterceptor', () => {
    let interceptor: RilogInterceptor;
    let storage: ReturnType<typeof getStorage>;

    beforeEach(() => {
        jest.clearAllMocks();
        interceptor = new RilogInterceptor(silentConfig);
        interceptor.init = true;
        storage = getStorage();
        storage.count.mockResolvedValue(0);
        storage.getAll.mockResolvedValue([]);
    });

    afterEach(() => {
        jest.clearAllTimers();
    });

    // ─── onRequest ────────────────────────────────────────────────────────────

    describe('onRequest', () => {
        it('enqueues a valid request', () => {
            interceptor.onRequest(makeRequest());
            // queue is not empty — onResponse will find it
            return expect(interceptor.onResponse(makeResponse())).resolves.toBeUndefined();
        });

        it('ignores a library-internal URL (connection/init)', () => {
            interceptor.onRequest(makeRequest('https://example.com/connection/init'));
            expect(storage.push).not.toHaveBeenCalled();
        });

        it('ignores a URL listed in ignoredRequests config', async () => {
            const i = new RilogInterceptor({ ...silentConfig, ignoredRequests: ['https://skip.me'] });
            i.init = true;
            i.onRequest(makeRequest('https://skip.me/data'));
            await i.onResponse(makeResponse('https://skip.me/data'));
            const s = getStorage();
            expect(s.push).not.toHaveBeenCalled();
        });

        it('ignores a URL matching the configured selfServer endpoint', async () => {
            const i = new RilogInterceptor({ ...silentConfig, selfServer: { url: 'http://myserver.com/save' } });
            i.init = true;
            i.onRequest(makeRequest('http://myserver.com/save'));
            await i.onResponse(makeResponse('http://myserver.com/save'));
            const s = getStorage();
            expect(s.push).not.toHaveBeenCalled();
        });
    });

    // ─── onResponse ───────────────────────────────────────────────────────────

    describe('onResponse', () => {
        it('is a no-op when response is null', async () => {
            await interceptor.onResponse(null);
            expect(storage.push).not.toHaveBeenCalled();
        });

        it('is a no-op when no matching request is queued', async () => {
            await interceptor.onResponse(makeResponse('https://api.example.com/never-requested'));
            expect(storage.push).not.toHaveBeenCalled();
        });

        it('pushes a REQUEST event after a matching onRequest', async () => {
            interceptor.onRequest(makeRequest());
            await interceptor.onResponse(makeResponse());
            expect(storage.push).toHaveBeenCalledTimes(1);
            const event = storage.push.mock.calls[0][0];
            expect(event.type).toBe(ERilogEvent.REQUEST);
        });

        it('clears the per-request timeout on response', async () => {
            jest.useFakeTimers();
            interceptor.onRequest(makeRequest());
            await interceptor.onResponse(makeResponse());
            // If timeout was not cleared, advancing past REQUEST_TIMEOUT_LIMIT would push an extra event
            jest.advanceTimersByTime(350_000);
            expect(storage.push).toHaveBeenCalledTimes(1);
            jest.useRealTimers();
        });
    });

    // ─── pushEvents / flush ───────────────────────────────────────────────────

    describe('flush on event limit', () => {
        it('triggers saveEvents when count exceeds EVENTS_ARRAY_LIMIT and queue is empty', async () => {
            storage.count.mockResolvedValue(EVENTS_ARRAY_LIMIT + 1);
            storage.getAll.mockResolvedValue([]);

            interceptor.onRequest(makeRequest());
            await interceptor.onResponse(makeResponse());

            expect(mockSaveEventsCustom).not.toHaveBeenCalled();
            expect(mockSaveEventsToRilog).toHaveBeenCalledTimes(1);
        });

        it('calls onSaveEvents callback during flush', async () => {
            const onSaveEvents = jest.fn();
            const i = new RilogInterceptor({ ...silentConfig, onSaveEvents });
            i.init = true;
            const s = getStorage();
            s.count.mockResolvedValue(EVENTS_ARRAY_LIMIT + 1);
            s.getAll.mockResolvedValue([]);

            i.onRequest(makeRequest());
            await i.onResponse(makeResponse());

            expect(onSaveEvents).toHaveBeenCalledTimes(1);
        });

        it('calls onPushEvent callback on every event push', async () => {
            const onPushEvent = jest.fn();
            const i = new RilogInterceptor({ ...silentConfig, onPushEvent });
            i.init = true;
            const s = getStorage();
            s.count.mockResolvedValue(0);

            i.onRequest(makeRequest());
            await i.onResponse(makeResponse());

            expect(onPushEvent).toHaveBeenCalledTimes(1);
            expect(onPushEvent.mock.calls[0][0].type).toBe(ERilogEvent.REQUEST);
        });

        it('clears storage by ids on successful save', async () => {
            const eventIds = ['id-1', 'id-2'];
            storage.count.mockResolvedValue(EVENTS_ARRAY_LIMIT + 1);
            storage.getAll.mockResolvedValue(eventIds.map((id) => ({ _id: id, type: ERilogEvent.REQUEST, date: '1', data: {}, location: {} })));
            mockSaveEventsToRilog.mockResolvedValue({ result: 'success' });

            interceptor.onRequest(makeRequest());
            await interceptor.onResponse(makeResponse());

            expect(storage.clearByIds).toHaveBeenCalledWith(eventIds);
        });

        it('does not clear storage when save result is not success', async () => {
            storage.count.mockResolvedValue(EVENTS_ARRAY_LIMIT + 1);
            storage.getAll.mockResolvedValue([]);
            mockSaveEventsToRilog.mockResolvedValue({ result: 'error' });

            interceptor.onRequest(makeRequest());
            await interceptor.onResponse(makeResponse());

            expect(storage.clearByIds).not.toHaveBeenCalled();
        });
    });

    // ─── sendEvents routing ───────────────────────────────────────────────────

    describe('sendEvents routing', () => {
        const flush = async (i: RilogInterceptor, s: ReturnType<typeof getStorage>) => {
            s.count.mockResolvedValue(EVENTS_ARRAY_LIMIT + 1);
            s.getAll.mockResolvedValue([]);
            i.onRequest(makeRequest());
            await i.onResponse(makeResponse());
        };

        it('routes to saveEventsCustom with localServer URL', async () => {
            const i = new RilogInterceptor({ ...silentConfig, localServer: { url: 'http://mylocal:3030', appName: 'app' } });
            i.init = true;
            await flush(i, getStorage());
            expect(mockSaveEventsCustom).toHaveBeenCalledTimes(1);
            expect(mockSaveEventsCustom.mock.calls[0][0].url).toContain('mylocal:3030');
        });

        it('routes to saveEventsCustom with selfServer URL', async () => {
            const i = new RilogInterceptor({ ...silentConfig, selfServer: { url: 'http://myapi.com/events' } });
            i.init = true;
            await flush(i, getStorage());
            expect(mockSaveEventsCustom).toHaveBeenCalledTimes(1);
            expect(mockSaveEventsCustom.mock.calls[0][0].url).toBe('http://myapi.com/events');
        });

        it('routes to saveEventsToRilog when no server is configured', async () => {
            await flush(interceptor, storage);
            expect(mockSaveEventsToRilog).toHaveBeenCalledTimes(1);
            expect(mockSaveEventsCustom).not.toHaveBeenCalled();
        });
    });

    // ─── onLogData ────────────────────────────────────────────────────────────

    describe('onLogData', () => {
        it('pushes a DEBUG_MESSAGE event to storage', async () => {
            await new Promise<void>((resolve) => {
                storage.push.mockImplementation(async () => { resolve(); });
                interceptor.onLogData('hello world', { label: 'test' });
            });
            const event = storage.push.mock.calls[0][0];
            expect(event.type).toBe(ERilogEvent.DEBUG_MESSAGE);
        });
    });

    // ─── onBeforeUnload ───────────────────────────────────────────────────────
    // Call the private method directly to avoid triggering other interceptors'
    // listeners that are registered on the same window object.

    describe('onBeforeUnload', () => {
        const unload = (i: RilogInterceptor) => (i as any).onBeforeUnload();

        const seedCache = async (i = interceptor) => {
            i.onRequest(makeRequest());
            await i.onResponse(makeResponse());
        };

        it('does nothing when eventsCache is empty', () => {
            const sendBeacon = jest.fn();
            Object.defineProperty(navigator, 'sendBeacon', { value: sendBeacon, configurable: true });
            unload(interceptor);
            expect(sendBeacon).not.toHaveBeenCalled();
        });

        it('does nothing when init is false', async () => {
            await seedCache();
            interceptor.init = false;
            const sendBeacon = jest.fn();
            Object.defineProperty(navigator, 'sendBeacon', { value: sendBeacon, configurable: true });
            unload(interceptor);
            expect(sendBeacon).not.toHaveBeenCalled();
        });

        it('calls sendBeacon with localServer URL on unload', async () => {
            const i = new RilogInterceptor({ ...silentConfig, localServer: { url: 'http://local:3030', appName: 'test' } });
            i.init = true;
            const s = getStorage();
            s.count.mockResolvedValue(0);
            await seedCache(i);

            const sendBeacon = jest.fn();
            Object.defineProperty(navigator, 'sendBeacon', { value: sendBeacon, configurable: true });
            unload(i);
            expect(sendBeacon).toHaveBeenCalledTimes(1);
            expect(sendBeacon.mock.calls[0][0]).toContain('local:3030');
        });

        it('calls sendBeacon with selfServer URL on unload', async () => {
            const i = new RilogInterceptor({ ...silentConfig, selfServer: { url: 'http://selfapi.com/save' } });
            i.init = true;
            const s = getStorage();
            s.count.mockResolvedValue(0);
            await seedCache(i);

            const sendBeacon = jest.fn();
            Object.defineProperty(navigator, 'sendBeacon', { value: sendBeacon, configurable: true });
            unload(i);
            expect(sendBeacon).toHaveBeenCalledTimes(1);
            expect(sendBeacon.mock.calls[0][0]).toBe('http://selfapi.com/save');
        });

        it('calls fetch with keepalive for Rilog cloud on unload', async () => {
            const mockFetch = jest.fn().mockResolvedValue({});
            global.fetch = mockFetch;

            await seedCache();
            interceptor.token = 'cloud-token';

            unload(interceptor);
            expect(mockFetch).toHaveBeenCalledTimes(1);
            expect(mockFetch.mock.calls[0][1].keepalive).toBe(true);
            expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe('Bearer cloud-token');
        });
    });

    // ─── request timeout auto-eviction ───────────────────────────────────────

    describe('request timeout auto-eviction', () => {
        it('records a timed-out request after REQUEST_TIMEOUT_LIMIT', async () => {
            jest.useFakeTimers();
            interceptor.onRequest(makeRequest());

            jest.advanceTimersByTime(300_001);
            // Allow microtasks to flush
            await Promise.resolve();

            expect(storage.push).toHaveBeenCalledTimes(1);
            const event = storage.push.mock.calls[0][0];
            expect(event.type).toBe(ERilogEvent.REQUEST);
            expect((event.data as any).response.data).toContain("Timeout");
            jest.useRealTimers();
        });
    });
});
