import { IRilogEventItem } from '../../../types/events';

export interface IRilogConsoleData {
    level: 'warn' | 'error';
    message: string;
    stackTrace?: string;
    source: 'console' | 'runtime' | 'unhandledRejection';
    errorFile?: string;
    errorLine?: number;
    errorColumn?: number;
}

export interface IRilogConsoleInterceptor {
    start(onEvent: (event: IRilogEventItem) => void): void;
    stop(): void;
}
