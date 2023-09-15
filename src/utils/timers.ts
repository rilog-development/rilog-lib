import { saveRequests } from './requests';
import { LONG_TIMER_LIMIT, SHORT_TIMER_LIMIT } from '../constants';
import { state, updatePartState } from '../state';
import { pushResponse } from '../feature/requests/index';
import { IRilogRequestItem } from '../types';

/**
 * Start/Clear timers
 */
const startShortTimer = () => {
    updatePartState({
        shortTimer: setTimeout(() => {
            // push empty response
            pushResponse({});
        }, state.config?.timeout || SHORT_TIMER_LIMIT),
    });
};

const clearShortTimer = () => {
    clearTimeout(state.shortTimer);
    updatePartState({ shortTimer: null });
};

const startLongTimer = (data: IRilogRequestItem[]) => {
    updatePartState({
        longTimer: setTimeout(() => {
            saveRequests(data);
        }, LONG_TIMER_LIMIT),
    });
};

const clearLongTimer = () => {
    clearTimeout(state.longTimer);
    updatePartState({ longTimer: null });
};

export { startShortTimer, clearShortTimer, startLongTimer, clearLongTimer };
