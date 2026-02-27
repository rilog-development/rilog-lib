import { ERilogEvent, IRilogEventItem } from '../../../types/events';
import { generateUniqueId, getLocation } from '../../../utils';
import { parseStackTrace } from '../../../utils/transforms';
import { IRilogConsoleData, IRilogConsoleInterceptor } from './types';

type TConsoleLevel = 'warn' | 'error';

class ConsoleInterceptor implements IRilogConsoleInterceptor {
    private originalWarn: typeof console.warn;
    private originalError: typeof console.error;
    private isStarted = false;

    constructor() {
        this.originalWarn = console.warn.bind(console);
        this.originalError = console.error.bind(console);
    }

    start(onEvent: (event: IRilogEventItem) => void): void {
        if (this.isStarted) return;
        this.isStarted = true;

        console.warn = (...args: any[]) => {
            this.originalWarn(...args);
            onEvent(this.getConsoleEvent(args, 'warn'));
        };

        console.error = (...args: any[]) => {
            this.originalError(...args);
            onEvent(this.getConsoleEvent(args, 'error'));
        };
    }

    stop(): void {
        console.warn = this.originalWarn;
        console.error = this.originalError;
        this.isStarted = false;
    }

    private getConsoleEvent(args: any[], level: TConsoleLevel): IRilogEventItem {
        const message = args.map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg))).join(' ');

        const stackTrace = parseStackTrace(new Error().stack || '');

        const data: IRilogConsoleData = { level, message, stackTrace };

        return {
            _id: generateUniqueId(),
            type: level === 'error' ? ERilogEvent.CONSOLE_ERROR : ERilogEvent.CONSOLE_WARN,
            date: Date.now().toString(),
            data,
            location: getLocation(),
        };
    }
}

export default ConsoleInterceptor;
