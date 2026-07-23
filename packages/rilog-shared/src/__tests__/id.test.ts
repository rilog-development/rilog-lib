import { generateUniqueId } from '../utils/id';

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
