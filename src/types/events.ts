export enum ERilogEvent {
    REQUEST,
    CLICK,
    INPUT,
    CONSOLE_ERROR,
    DEBUG_MESSAGE,
}

export interface IRilogEventItem {
    _id: string;
    type: ERilogEvent;
    date: string; // timestamp for filtering events by creating time
    data: any;
}
