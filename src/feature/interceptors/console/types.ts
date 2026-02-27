import { IRilogEventItem } from '../../../types/events';

/**
 * !!!Should be updated with BACKEND types
 */
export interface IRilogConsoleData {
    level: 'warn' | 'error';
    message: string;
    stackTrace?: string;
}

export interface IRilogConsoleInterceptor {
    start(onEvent: (event: IRilogEventItem) => void): void;
    stop(): void;
}
