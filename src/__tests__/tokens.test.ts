/**
 * @jest-environment jsdom
 */
import { getUserUniqToken, updateUserUniqToken, generateUniqueId } from '../utils/tokens';
import { RIL_TOKEN } from '../constants';

describe('tokens', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe('getUserUniqToken', () => {
        it('generates and stores a new token when none exists', () => {
            const token = getUserUniqToken();
            expect(typeof token).toBe('string');
            expect(token.length).toBeGreaterThan(0);
            expect(localStorage.getItem(RIL_TOKEN)).toBe(token);
        });

        it('returns the already-stored token on subsequent calls', () => {
            const first = getUserUniqToken();
            const second = getUserUniqToken();
            expect(first).toBe(second);
        });

        it('returns the token previously set in localStorage', () => {
            localStorage.setItem(RIL_TOKEN, 'preset-token');
            expect(getUserUniqToken()).toBe('preset-token');
        });
    });

    describe('updateUserUniqToken', () => {
        it('writes the given token to localStorage', () => {
            updateUserUniqToken('new-token-123');
            expect(localStorage.getItem(RIL_TOKEN)).toBe('new-token-123');
        });

        it('overwrites an existing token', () => {
            localStorage.setItem(RIL_TOKEN, 'old-token');
            updateUserUniqToken('replaced-token');
            expect(localStorage.getItem(RIL_TOKEN)).toBe('replaced-token');
        });
    });

    describe('generateUniqueId', () => {
        it('returns a non-empty string', () => {
            const id = generateUniqueId();
            expect(typeof id).toBe('string');
            expect(id.length).toBeGreaterThan(0);
        });

        it('returns a unique value each call', () => {
            const ids = new Set(Array.from({ length: 200 }, () => generateUniqueId()));
            expect(ids.size).toBe(200);
        });
    });
});
