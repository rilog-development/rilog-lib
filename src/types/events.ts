/**
 * Different types of events.
 * !!!Should be updated with BACKEND type
 */
export enum ERilogEvent {
    REQUEST,
    CLICK,
    INPUT,
    CONSOLE_ERROR,
    DEBUG_MESSAGE,
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
    data: any;
    location: IRilogLocation; // every Rilog event should be saved with location (for defining page)
}
