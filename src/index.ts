import Rilog from './core/Rilog';
import { TRilogState } from './types';
import { presets } from './presets';

const defaultState = {
    init: false,
    token: null,
    recording: false,
    config: null,
} as TRilogState;

const rilog = new Rilog(defaultState);

export { presets };
export default rilog;
