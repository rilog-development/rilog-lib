import Rilog from './core/Rilog';
import { IRilogRequestTimed, TRilogState } from './types';

const defaultState = {
    init: false,
    request: null as null | IRilogRequestTimed,
    token: null,
    salt: null,
    recording: false,
    key: null,
    config: null,
    shortTimer: null,
    longTimer: null,
} as TRilogState;

const rilog = new Rilog(defaultState);

export default rilog;
