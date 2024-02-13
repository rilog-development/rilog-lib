import { IRilogEventItem } from '../../../types/events';

export interface IRilogMessageInterceptor {
    getMessageEvent: <T>(data: T, config: IRilogMessageConfig | undefined) => IRilogEventItem;
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
}
