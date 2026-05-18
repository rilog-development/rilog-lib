import { isUrlIgnored, isLibruarySensetiveRequest } from '../utils/filters';

describe('isUrlIgnored', () => {
    it('returns false when ignoredRequests is empty', () => {
        expect(isUrlIgnored('https://api.example.com/users', [])).toBe(false);
    });

    it('returns true when url contains an ignored substring', () => {
        expect(isUrlIgnored('https://analytics.example.com/track', ['analytics.example.com'])).toBe(true);
    });

    it('is case-insensitive', () => {
        expect(isUrlIgnored('https://API.EXAMPLE.COM/users', ['api.example.com'])).toBe(true);
    });

    it('returns false when url does not match any ignored entry', () => {
        expect(isUrlIgnored('https://api.example.com/users', ['analytics.example.com', '/health'])).toBe(false);
    });

    it('matches partial path segments', () => {
        expect(isUrlIgnored('/api/health-check', ['/api/health'])).toBe(true);
    });

    it('matches multiple ignored entries correctly', () => {
        expect(isUrlIgnored('https://api.example.com/users', ['analytics', 'api.example'])).toBe(true);
    });
});

describe('isLibruarySensetiveRequest', () => {
    it('returns true for connection/init endpoint', () => {
        expect(isLibruarySensetiveRequest('https://api.rilog.online/connection/init')).toBe(true);
    });

    it('returns true for connection/send endpoint', () => {
        expect(isLibruarySensetiveRequest('https://api.rilog.online/connection/send')).toBe(true);
    });

    it('returns true for events/save endpoint', () => {
        expect(isLibruarySensetiveRequest('https://api.rilog.online/events/save')).toBe(true);
    });

    it('returns false for regular app URLs', () => {
        expect(isLibruarySensetiveRequest('https://api.example.com/users')).toBe(false);
    });

    it('returns false for URLs that partially overlap but do not match', () => {
        expect(isLibruarySensetiveRequest('https://api.example.com/save-data')).toBe(false);
    });
});
