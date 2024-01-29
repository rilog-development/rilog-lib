import Rilog from './core/Rilog';
import { TRilogState } from './types';

const defaultState = {
    init: false,
    token: null,
    salt: null,
    recording: false,
    key: null,
    config: null,
} as TRilogState;


const rilog = new Rilog(defaultState);

export default rilog;
