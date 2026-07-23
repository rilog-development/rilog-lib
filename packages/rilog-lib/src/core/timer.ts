import { LONG_TIMER_LIMIT } from '../constants';
import { IRilogTimer } from '../types/timer';

class RilogTimer implements IRilogTimer {
    longTimer: any;
    startLong(afterTimeoutFn: () => void) {
        this.clearLong();
        this.longTimer = setTimeout(() => {
            afterTimeoutFn();
        }, LONG_TIMER_LIMIT);
    }

    clearLong() {
        clearTimeout(this.longTimer);
        this.longTimer = null;
    }
}

export default RilogTimer;
