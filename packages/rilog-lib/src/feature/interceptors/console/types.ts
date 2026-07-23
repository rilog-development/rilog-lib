import { IRilogEventItem } from '@rilog-development/rilog-shared';

export interface IRilogConsoleInterceptor {
    start(onEvent: (event: IRilogEventItem) => void): void;
    stop(): void;
}
