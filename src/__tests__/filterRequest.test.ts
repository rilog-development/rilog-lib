import RilogFilterRequest from '../core/filterRequest';
import { TRilogInitConfig } from '../types';
import { IRilogRequestTimed } from '../types/requests';
import { IRilogEventItem, ERilogEvent } from '../types/events';

const makeRequest = (overrides: Partial<IRilogRequestTimed> = {}): IRilogRequestTimed => ({
    url: 'https://api.example.com/data',
    method: 'GET',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
    data: { body: 'payload' },
    location: { origin: 'https://app.example.com', href: 'https://app.example.com/page' },
    localStorage: null,
    timestamp: Date.now(),
    ...overrides,
});

const makeEvent = (date: string): IRilogEventItem => ({
    _id: Math.random().toString(),
    type: ERilogEvent.REQUEST,
    date,
    data: {} as any,
    location: { origin: null, href: null },
});

describe('RilogFilterRequest', () => {
    describe('isIgnoredRequest', () => {
        it('returns false when no ignoredRequests config', () => {
            const filter = new RilogFilterRequest({});
            expect(filter.isIgnoredRequest(makeRequest())).toBe(false);
        });

        it('returns true when url matches an ignored entry (case-insensitive)', () => {
            const config: TRilogInitConfig = { ignoredRequests: ['API.EXAMPLE.COM'] };
            const filter = new RilogFilterRequest(config);
            expect(filter.isIgnoredRequest(makeRequest())).toBe(true);
        });

        it('returns false when url does not match any ignored entry', () => {
            const config: TRilogInitConfig = { ignoredRequests: ['other-domain.com'] };
            const filter = new RilogFilterRequest(config);
            expect(filter.isIgnoredRequest(makeRequest())).toBe(false);
        });
    });

    describe('isLibruaryRequest', () => {
        it('returns true for rilog internal endpoints', () => {
            const filter = new RilogFilterRequest(null);
            expect(filter.isLibruaryRequest(makeRequest({ url: 'https://api.rilog.online/events/save' }))).toBe(true);
        });

        it('returns false for regular app endpoints', () => {
            const filter = new RilogFilterRequest(null);
            expect(filter.isLibruaryRequest(makeRequest())).toBe(false);
        });
    });

    describe('getRequests — sensitive URL (headers + body masked)', () => {
        it('masks headers and data when url matches sensetiveRequsts', () => {
            const config: TRilogInitConfig = { sensetiveRequsts: ['/api/auth'] };
            const filter = new RilogFilterRequest(config);
            const result = filter.getRequests(makeRequest({ url: 'https://api.example.com/api/auth/login' }));
            expect(result.headers).toBe('sensetive');
            expect(result.data).toBe('sensetive');
        });

        it('does not mask non-matching URLs', () => {
            const config: TRilogInitConfig = { sensetiveRequsts: ['/api/auth'] };
            const filter = new RilogFilterRequest(config);
            const result = filter.getRequests(makeRequest());
            expect(result.data).not.toBe('sensetive');
        });
    });

    describe('getRequests — sensetiveDataRequests (body only masked)', () => {
        it('masks only data, not headers, for matching URL', () => {
            const config: TRilogInitConfig = { sensetiveDataRequests: ['/api/pay'] };
            const filter = new RilogFilterRequest(config);
            const result = filter.getRequests(makeRequest({ url: 'https://api.example.com/api/pay/card' }));
            expect(result.data).toBe('sensetive');
            expect(result.headers).not.toBe('sensetive');
        });
    });

    describe('getRequests — headers allowlist', () => {
        it('returns only allowlisted headers', () => {
            const config: TRilogInitConfig = { headers: ['Content-Type'] };
            const filter = new RilogFilterRequest(config);
            const result = filter.getRequests(makeRequest());
            expect(result.headers).toEqual({ 'Content-Type': 'application/json' });
            expect((result.headers as any)['Authorization']).toBeUndefined();
        });

        it('returns empty object when allowlisted header is not present', () => {
            const config: TRilogInitConfig = { headers: ['X-Custom-Header'] };
            const filter = new RilogFilterRequest(config);
            const result = filter.getRequests(makeRequest());
            expect(result.headers).toEqual({});
        });

        it('does not filter headers when config has no headers allowlist', () => {
            const filter = new RilogFilterRequest({});
            const req = makeRequest();
            const result = filter.getRequests(req);
            expect(result.headers).toEqual(req.headers);
        });

        it('preserves sensetive headers marker and skips header filtering', () => {
            const config: TRilogInitConfig = { sensetiveRequsts: ['/api/auth'], headers: ['Content-Type'] };
            const filter = new RilogFilterRequest(config);
            const result = filter.getRequests(makeRequest({ url: 'https://api.example.com/api/auth' }));
            expect(result.headers).toBe('sensetive');
        });
    });

    describe('getRequests — localStorage allowlist', () => {
        it('returns empty string when no localStorage config', () => {
            const filter = new RilogFilterRequest({});
            const result = filter.getRequests(makeRequest({ localStorage: JSON.stringify({ token: 'abc', userId: '1' }) }));
            expect(result.localStorage).toBe('');
        });

        it('returns empty string when localStorage data is null', () => {
            const config: TRilogInitConfig = { localStorage: ['token'] };
            const filter = new RilogFilterRequest(config);
            const result = filter.getRequests(makeRequest({ localStorage: null }));
            expect(result.localStorage).toBe('');
        });

        it('filters localStorage to only allowlisted keys', () => {
            const config: TRilogInitConfig = { localStorage: ['token'] };
            const filter = new RilogFilterRequest(config);
            const result = filter.getRequests(makeRequest({ localStorage: JSON.stringify({ token: 'abc', userId: '1' }) }));
            expect(result.localStorage).toEqual({ token: 'abc' });
        });

        it('returns empty string when no allowlisted key is present in storage', () => {
            const config: TRilogInitConfig = { localStorage: ['missingKey'] };
            const filter = new RilogFilterRequest(config);
            const result = filter.getRequests(makeRequest({ localStorage: JSON.stringify({ token: 'abc' }) }));
            expect(result.localStorage).toBe('');
        });
    });

    describe('sortEventsByDate', () => {
        it('sorts events by date ascending', () => {
            const filter = new RilogFilterRequest(null);
            const events = [makeEvent('1716000300000'), makeEvent('1716000100000'), makeEvent('1716000200000')];
            const sorted = filter.sortEventsByDate(events);
            expect(sorted[0].date).toBe('1716000100000');
            expect(sorted[1].date).toBe('1716000200000');
            expect(sorted[2].date).toBe('1716000300000');
        });

        it('returns single event unchanged', () => {
            const filter = new RilogFilterRequest(null);
            const events = [makeEvent('1716000100000')];
            expect(filter.sortEventsByDate(events)).toHaveLength(1);
        });
    });
});
