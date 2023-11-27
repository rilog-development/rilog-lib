import { LONG_TIMER_LIMIT, SHORT_TIMER_LIMIT } from "../constants";
import { IRilogTimer } from "../types/timer";

class RilogTimer implements IRilogTimer {
    shortTimer: any;
    longTimer: any;

    startShort(afterTimeoutFn: () => void) {
        this.shortTimer = setTimeout(() => {
            afterTimeoutFn();
        }, SHORT_TIMER_LIMIT);
    };

    clearShort() {
        clearTimeout(this.shortTimer);
        this.shortTimer = null;
    };

    startLong(afterTimeoutFn: () => void) {
        this.longTimer = setTimeout(() => {
            afterTimeoutFn();
        }, LONG_TIMER_LIMIT);
    };

    clearLong() {
        clearTimeout(this.longTimer);
        this.longTimer = null;
    };
}

export default RilogTimer;