import { IRilogEventItem } from '@rilog-development/rilog-shared';

export interface IRilogInputInterceptor {
    start(onEvent: (event: IRilogEventItem) => void): void;
    stop(): void;
}
