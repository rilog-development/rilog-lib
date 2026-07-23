/**
 * @jest-environment jsdom
 */

// jsdom does not ship PromiseRejectionEvent — polyfill it for tests
if (typeof PromiseRejectionEvent === 'undefined') {
    (global as any).PromiseRejectionEvent = class PromiseRejectionEvent extends Event {
        reason: any;
        promise: Promise<any>;
        constructor(type: string, init: { promise: Promise<any>; reason: any }) {
            super(type, { cancelable: true });
            this.promise = init.promise;
            this.reason = init.reason;
        }
    };
}

import ConsoleInterceptor from '../feature/interceptors/console';
import { ERilogEvent } from '../types/events';

describe('ConsoleInterceptor', () => {
    let interceptor: ConsoleInterceptor;
    let onEvent: jest.Mock;
    let originalWarn: typeof console.warn;
    let originalError: typeof console.error;

    beforeEach(() => {
        originalWarn = console.warn;
        originalError = console.error;
        interceptor = new ConsoleInterceptor();
        onEvent = jest.fn();
    });

    afterEach(() => {
        interceptor.stop();
        console.warn = originalWarn;
        console.error = originalError;
    });

    describe('start / stop', () => {
        it('replaces console.warn and console.error after start', () => {
            interceptor.start(onEvent);
            expect(console.warn).not.toBe(originalWarn);
            expect(console.error).not.toBe(originalError);
        });

        it('restores console.warn and console.error after stop', () => {
            interceptor.start(onEvent);
            const patchedWarn = console.warn;
            const patchedError = console.error;
            interceptor.stop();
            // Patched functions must be gone
            expect(console.warn).not.toBe(patchedWarn);
            expect(console.error).not.toBe(patchedError);
            // Calling them after stop must not fire onEvent
            console.warn('after stop');
            console.error('after stop');
            expect(onEvent).not.toHaveBeenCalled();
        });

        it('ignores a second start call (idempotent)', () => {
            interceptor.start(onEvent);
            const patchedWarn = console.warn;
            interceptor.start(onEvent);
            expect(console.warn).toBe(patchedWarn);
        });
    });

    describe('console.warn interception', () => {
        it('fires onEvent with CONSOLE_WARN type', () => {
            interceptor.start(onEvent);
            console.warn('test warning');
            expect(onEvent).toHaveBeenCalledTimes(1);
            expect(onEvent.mock.calls[0][0].type).toBe(ERilogEvent.CONSOLE_WARN);
        });

        it('sets level to "warn" and source to "console"', () => {
            interceptor.start(onEvent);
            console.warn('msg');
            const { data } = onEvent.mock.calls[0][0];
            expect(data.level).toBe('warn');
            expect(data.source).toBe('console');
        });

        it('includes the message text', () => {
            interceptor.start(onEvent);
            console.warn('hello world');
            expect(onEvent.mock.calls[0][0].data.message).toContain('hello world');
        });

        it('serializes multiple arguments as a space-joined string', () => {
            interceptor.start(onEvent);
            console.warn('part1', 'part2', 'part3');
            expect(onEvent.mock.calls[0][0].data.message).toBe('part1 part2 part3');
        });
    });

    describe('console.error interception', () => {
        it('fires onEvent with CONSOLE_ERROR type', () => {
            interceptor.start(onEvent);
            console.error('test error');
            expect(onEvent.mock.calls[0][0].type).toBe(ERilogEvent.CONSOLE_ERROR);
        });

        it('sets level to "error"', () => {
            interceptor.start(onEvent);
            console.error('err');
            expect(onEvent.mock.calls[0][0].data.level).toBe('error');
        });

        it('serializes Error objects including the message', () => {
            interceptor.start(onEvent);
            console.error(new Error('boom'));
            expect(onEvent.mock.calls[0][0].data.message).toContain('boom');
        });

        it('serializes plain objects via JSON', () => {
            interceptor.start(onEvent);
            console.error({ code: 500 });
            expect(onEvent.mock.calls[0][0].data.message).toContain('500');
        });
    });

    describe('window.onerror interception', () => {
        it('fires onEvent with CONSOLE_ERROR type and source "runtime"', () => {
            interceptor.start(onEvent);
            window.onerror?.('Something broke', 'script.js', 10, 5, new Error('Something broke'));
            expect(onEvent).toHaveBeenCalledTimes(1);
            const { type, data } = onEvent.mock.calls[0][0];
            expect(type).toBe(ERilogEvent.CONSOLE_ERROR);
            expect(data.source).toBe('runtime');
            expect(data.message).toBe('Something broke');
        });

        it('includes errorFile and errorLine from onerror args', () => {
            interceptor.start(onEvent);
            window.onerror?.('msg', 'app.js', 42, 8, undefined);
            const { data } = onEvent.mock.calls[0][0];
            expect(data.errorFile).toBe('app.js');
            expect(data.errorLine).toBe(42);
            expect(data.errorColumn).toBe(8);
        });
    });

    describe('unhandledrejection interception', () => {
        const dispatch = (reason: any) => {
            const promise = Promise.reject(reason);
            promise.catch(() => {}); // prevent Node from crashing on unhandled rejection
            window.dispatchEvent(new PromiseRejectionEvent('unhandledrejection', { promise, reason }));
        };

        it('fires onEvent when an Error is the rejection reason', () => {
            interceptor.start(onEvent);
            dispatch(new Error('unhandled'));
            expect(onEvent).toHaveBeenCalledTimes(1);
            expect(onEvent.mock.calls[0][0].data.message).toBe('unhandled');
        });

        it('fires onEvent with a fallback message for non-Error reasons', () => {
            interceptor.start(onEvent);
            dispatch('fail');
            expect(onEvent.mock.calls[0][0].data.message).toContain('Unhandled rejection: fail');
        });

        it('does not fire after stop', () => {
            interceptor.start(onEvent);
            interceptor.stop();
            dispatch('x');
            expect(onEvent).not.toHaveBeenCalled();
        });
    });

    describe('event structure', () => {
        it('emitted event has _id, type, date, data, location fields', () => {
            interceptor.start(onEvent);
            console.warn('check');
            const event = onEvent.mock.calls[0][0];
            expect(typeof event._id).toBe('string');
            expect(event.type).toBeDefined();
            expect(typeof event.date).toBe('string');
            expect(event.data).toBeDefined();
            expect(event.location).toBeDefined();
        });
    });
});
