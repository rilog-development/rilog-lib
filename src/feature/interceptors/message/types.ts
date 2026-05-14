import { IRilogEventItem } from '../../../types/events';

export interface IRilogMessageInterceptor {
    getMessageEvent: <T>(data: T, config: IRilogMessageConfig | undefined, stackTrace?: string) => IRilogEventItem;
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
