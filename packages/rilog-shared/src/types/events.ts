import { IRilogRequestItem } from './requests';

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
export interface IRilogClick {
    id: string;
    inner: string;
    nodeName: string;
    classNames: string;
}

export interface IRilogConsoleData {
    level: 'warn' | 'error';
    message: string;
    stackTrace?: string;
    source: 'console' | 'runtime' | 'unhandledRejection';
    errorFile?: string;
    errorLine?: number;
    errorColumn?: number;
}

export enum RilogInputEvent {
    BLUR,
}

/**
 * !!!Should be updated with BACKEND types
 */
export interface IRilogInput {
    type: RilogInputEvent;
    value: string;
    nodeName: string;
    className: string;
    id: string;
    name: string;
    inputType: string;
}

export interface IRilogMessageConfig {
    label: string;
}

/**
 * !!!Should be updated with BACKEND types
 */
export interface IRilogMessageData {
    data: string;
    /**
     * Used for filtering message by some label.
     */
    label: IRilogMessageConfig['label'];
    /**
     * Need for check pasing in backend app.
     */
    shouldBeParsed: boolean;
    /**
     * Captured call stack from the consumer application at the moment of logData() call.
     * Requires source maps enabled in the consuming app for readable file/line references.
     */
    stackTrace?: string;
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
