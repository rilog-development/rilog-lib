import { RIL_STATE } from './constants';
import { IRilogRequestTimed, TRilogState } from './types';

const defaultState = {
    init: false, // app done init
    request: null as null | IRilogRequestTimed, // push requests data
    token: null, // token for user auth requests
    salt: null, // salt for encoding push data
    recording: false, // enable/disable recording requests
    key: null, // app key for connection to back (to your current app),
    config: null, // config for requests
    // shouldSave: false, // should save requests (to back storage)
    shortTimer: null, // Use it for saving request data (if request data equal to REQUESTS_ARRAY_LIMIT)
    longTimer: null, // Use it saving request data (if user did not do requests during a long time),
} as TRilogState;

/**
 * Functions for updatings state
 */

/**
 * Set default state to storage
 */
const initState = () => {
    setState(defaultState);
};

/**
 *
 * @param {object} state - set state to storage
 */
const setState = (state: TRilogState) => {
    localStorage.setItem(RIL_STATE, JSON.stringify(state));
};

/**
 * Return state from storage or return default state
 * @returns {object}
 */
const getState = () => {
    const stateStr = localStorage.getItem(RIL_STATE);
    return stateStr ? JSON.parse(stateStr) : defaultState;
};

/**
 * Update some fields of state
 * @param updatedPartState
 */
const updatePartState = (updatedPartState: object) => {
    const state = getState();

    const updatedState = {
        ...state,
        ...updatedPartState,
    };

    setState(updatedState);
};

export { initState, getState, updatePartState };
