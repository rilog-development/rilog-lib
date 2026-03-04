import { ERilogEvent, IRilogEventItem } from '../../../types/events';
import { generateUniqueId, getLocation } from '../../../utils';
import { parseStackTrace } from '../../../utils/transforms';
import { IRilogConsoleData, IRilogConsoleInterceptor } from './types';

type TConsoleLevel = 'warn' | 'error';

class ConsoleInterceptor implements IRilogConsoleInterceptor {
    private originalWarn: typeof console.warn;
    private originalError: typeof console.error;
    private originalOnError: typeof window.onerror;
    private isStarted = false;
    private onUnhandledRejection: ((event: PromiseRejectionEvent) => void) | null = null;

    constructor() {
        this.originalWarn = console.warn.bind(console);
        this.originalError = console.error.bind(console);
        this.originalOnError = window.onerror;
    }

    start(onEvent: (event: IRilogEventItem) => void): void {
        if (this.isStarted) return;
        this.isStarted = true;

        /**
         * Intercept explicit console.warn() calls.
         */
        console.warn = (...args: any[]) => {
            this.originalWarn(...args);
            onEvent(this.buildEvent(args, 'warn', 'console', ERilogEvent.CONSOLE_WARN));
        };

        /**
         * Intercept explicit console.error() calls.
         */
        console.error = (...args: any[]) => {
            this.originalError(...args);
            onEvent(this.buildEvent(args, 'error', 'console', ERilogEvent.CONSOLE_ERROR));
        };

        /**
         * Intercept uncaught runtime JS exceptions:
         * Uncaught TypeError, ReferenceError, etc.
         */
        window.onerror = (message, _source, _lineno, _colno, error) => {
            const msg = typeof message === 'string' ? message : String(message);
            const stackTrace = error?.stack ? parseStackTrace(error.stack) : undefined;

            onEvent(this.buildEventFromData({ level: 'error', message: msg, stackTrace, source: 'runtime' }, ERilogEvent.CONSOLE_ERROR));

            if (typeof this.originalOnError === 'function') {
                this.originalOnError(message, _source, _lineno, _colno, error);
            }
            return false;
        };

        /**
         * Intercept unhandled Promise rejections.
         */
        this.onUnhandledRejection = (event: PromiseRejectionEvent) => {
            const reason = event.reason;
            const message = reason instanceof Error
                ? reason.message
                : `Unhandled rejection: ${String(reason)}`;
            const stackTrace = reason instanceof Error && reason.stack
                ? parseStackTrace(reason.stack)
                : undefined;

            onEvent(this.buildEventFromData({ level: 'error', message, stackTrace, source: 'unhandledRejection' }, ERilogEvent.CONSOLE_ERROR));
        };

        window.addEventListener('unhandledrejection', this.onUnhandledRejection);
    }

    stop(): void {
        console.warn = this.originalWarn;
        console.error = this.originalError;
        window.onerror = this.originalOnError;

        if (this.onUnhandledRejection) {
            window.removeEventListener('unhandledrejection', this.onUnhandledRejection);
            this.onUnhandledRejection = null;
        }

        this.isStarted = false;
    }

    private buildEvent(args: any[], level: TConsoleLevel, source: IRilogConsoleData['source'], type: ERilogEvent): IRilogEventItem {
        const message = args
            .map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg)))
            .join(' ');

        const stackTrace = parseStackTrace(new Error().stack || '');

        return this.buildEventFromData({ level, message, stackTrace, source }, type);
    }

    private buildEventFromData(data: IRilogConsoleData, type: ERilogEvent): IRilogEventItem {
        return {
            _id: generateUniqueId(),
            type,
            date: Date.now().toString(),
            data,
            location: getLocation(),
        };
    }
}

export default ConsoleInterceptor;
