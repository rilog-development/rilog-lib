import { IRilogRequestItem } from './requests';
import { IRilogClick } from '../feature/interceptors/click/types';
import { IRilogConsoleData } from '../feature/interceptors/console/types';
import { IRilogMessageData } from '../feature/interceptors/message/types';
import { IRilogInput } from '../feature/interceptors/input/types';

/**
 * Different types of events.
 * !!!Should be updated with BACKEND types
 */
export enum ERilogEvent {
    REQUEST,
    CLICK,
    INPUT, // TODO: Future feature
    CONSOLE_ERROR,
    DEBUG_MESSAGE,
    CONSOLE_WARN,
}

export interface IRilogLocation {
    origin: string | null;
    href: string | null;
}

/**
 * !!!Should be updated with BACKEND types
 */
export interface IRilogEventItem {
    _id: string;
    type: ERilogEvent;
    date: string; // timestamp for filtering events by creating time
    data: IRilogRequestItem | IRilogClick | IRilogMessageData | IRilogInput | IRilogConsoleData;
    location: IRilogLocation; // every Rilog event should be saved with location (for defining page)
}
