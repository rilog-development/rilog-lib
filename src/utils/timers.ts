import { saveRequests } from './requests';
import { LONG_TIMER_LIMIT, SHORT_TIMER_LIMIT } from '../constants';
import { getState, updatePartState } from '../state';
import { pushResponse } from '../feature/requests/index';
import { IRilogRequestItem } from '../types';

/**
 * Start/Clear timers
 */
const startShortTimer = () => {
    const state = getState();

    updatePartState({
        shortTimer: setTimeout(() => {
            // push empty response
            pushResponse({});
        }, state.config?.timeout || SHORT_TIMER_LIMIT),
    });
};

const clearShortTimer = () => {
    const state = getState();

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
    const state = getState();

    clearTimeout(state.longTimer);
    updatePartState({ longTimer: null });
};

export { startShortTimer, clearShortTimer, startLongTimer, clearLongTimer };
