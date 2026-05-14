import { IRilogEventItem } from '../../../types/events';

/**
 * !!!Should be updated with BACKEND types
 */
export interface IRilogConsoleData {
    level: 'warn' | 'error';
    message: string;
    stackTrace?: string;
    /**
     * Distinguishes the source of the error:
     * - 'console'             — explicit console.warn() / console.error() call
     * - 'runtime'             — uncaught JS exception via window.onerror
     * - 'unhandledRejection'  — unhandled Promise rejection
     */
    source: 'console' | 'runtime' | 'unhandledRejection';
}

export interface IRilogConsoleInterceptor {
    start(onEvent: (event: IRilogEventItem) => void): void;
    stop(): void;
}
