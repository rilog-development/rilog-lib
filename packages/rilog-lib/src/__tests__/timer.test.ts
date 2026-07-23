import RilogTimer from '../core/timer';
import { LONG_TIMER_LIMIT } from '../constants';

describe('RilogTimer', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('calls callback after LONG_TIMER_LIMIT ms', () => {
        const timer = new RilogTimer();
        const fn = jest.fn();
        timer.startLong(fn);
        expect(fn).not.toHaveBeenCalled();
        jest.advanceTimersByTime(LONG_TIMER_LIMIT);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('does not call callback before the timeout elapses', () => {
        const timer = new RilogTimer();
        const fn = jest.fn();
        timer.startLong(fn);
        jest.advanceTimersByTime(LONG_TIMER_LIMIT - 1);
        expect(fn).not.toHaveBeenCalled();
    });

    it('clearLong cancels the pending timer', () => {
        const timer = new RilogTimer();
        const fn = jest.fn();
        timer.startLong(fn);
        timer.clearLong();
        jest.advanceTimersByTime(LONG_TIMER_LIMIT);
        expect(fn).not.toHaveBeenCalled();
    });

    it('startLong resets an existing timer, restarting the countdown', () => {
        const timer = new RilogTimer();
        const fn1 = jest.fn();
        const fn2 = jest.fn();
        timer.startLong(fn1);
        jest.advanceTimersByTime(LONG_TIMER_LIMIT - 1000);
        timer.startLong(fn2);
        jest.advanceTimersByTime(LONG_TIMER_LIMIT);
        expect(fn1).not.toHaveBeenCalled();
        expect(fn2).toHaveBeenCalledTimes(1);
    });

    it('clearLong is safe to call when no timer is running', () => {
        const timer = new RilogTimer();
        expect(() => timer.clearLong()).not.toThrow();
    });

    it('clearLong sets longTimer to null', () => {
        const timer = new RilogTimer();
        timer.startLong(() => {});
        timer.clearLong();
        expect(timer.longTimer).toBeNull();
    });
});
