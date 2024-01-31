import Rilog from './core/Rilog';
import { TRilogState } from './types';
import InteractivePanel from './feature/interactivePanel';

const defaultState = {
    init: false,
    token: null,
    salt: null,
    recording: false,
    key: null,
    config: null,
} as TRilogState;

const rilog = new Rilog(defaultState, {
    interactivePanel: new InteractivePanel(),
});

export default rilog;
