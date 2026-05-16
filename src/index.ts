import Rilog from './core/Rilog';
import { TRilogState } from './types';

const defaultState = {
    init: false,
    token: null,
    recording: false,
    config: null,
} as TRilogState;

const rilog = new Rilog(defaultState);

export default rilog;
