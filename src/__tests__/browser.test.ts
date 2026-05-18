/**
 * @jest-environment jsdom
 */
import { getExternalInfo, getLocation, getDeviceInfo } from '../utils/browser';

describe('browser utils', () => {
    describe('getExternalInfo', () => {
        it('returns userAgent from navigator', () => {
            const info = getExternalInfo();
            expect(typeof info.userAgent).toBe('string');
        });

        it('includes meta when provided', () => {
            const meta = { environment: 'staging', branch: 'main', framework: 'react', platform: 'web' } as const;
            const info = getExternalInfo(meta);
            expect(info.meta).toEqual(meta);
        });

        it('omits meta key when not provided', () => {
            const info = getExternalInfo();
            expect(info).not.toHaveProperty('meta');
        });
    });

    describe('getLocation', () => {
        it('returns an object with origin and href', () => {
            const location = getLocation();
            expect(location).toHaveProperty('origin');
            expect(location).toHaveProperty('href');
        });

        it('returns string or null for origin and href', () => {
            const location = getLocation();
            expect(location.origin === null || typeof location.origin === 'string').toBe(true);
            expect(location.href === null || typeof location.href === 'string').toBe(true);
        });
    });

    describe('getDeviceInfo', () => {
        it('returns all required fields', () => {
            const info = getDeviceInfo();
            expect(info).toHaveProperty('userAgent');
            expect(info).toHaveProperty('screenWidth');
            expect(info).toHaveProperty('screenHeight');
            expect(info).toHaveProperty('viewportWidth');
            expect(info).toHaveProperty('viewportHeight');
            expect(info).toHaveProperty('devicePixelRatio');
            expect(info).toHaveProperty('colorDepth');
            expect(info).toHaveProperty('language');
            expect(info).toHaveProperty('hardwareConcurrency');
            expect(info).toHaveProperty('deviceType');
            expect(info).toHaveProperty('connectionType');
        });

        it('deviceType is one of mobile | tablet | desktop', () => {
            const { deviceType } = getDeviceInfo();
            expect(['mobile', 'tablet', 'desktop']).toContain(deviceType);
        });
    });

    describe('resolveDeviceType (via getDeviceInfo)', () => {
        const setUA = (ua: string) =>
            Object.defineProperty(window.navigator, 'userAgent', { value: ua, configurable: true });

        it('detects mobile from iPhone UA', () => {
            setUA('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1');
            expect(getDeviceInfo().deviceType).toBe('mobile');
        });

        it('detects mobile from Android UA', () => {
            setUA('Mozilla/5.0 (Linux; Android 13; Pixel 7) Mobile');
            expect(getDeviceInfo().deviceType).toBe('mobile');
        });

        it('detects tablet from iPad UA', () => {
            setUA('Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)');
            expect(getDeviceInfo().deviceType).toBe('tablet');
        });

        it('detects desktop from Windows UA', () => {
            setUA('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
            expect(getDeviceInfo().deviceType).toBe('desktop');
        });

        it('detects desktop from macOS UA', () => {
            setUA('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1');
            expect(getDeviceInfo().deviceType).toBe('desktop');
        });
    });
});
