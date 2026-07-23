import { IRilogEventItem } from '../../../types/events';

export interface IRilogInputInterceptor {
    start(onEvent: (event: IRilogEventItem) => void): void;
    stop(): void;
}

export enum RilogInputEvent {
    BLUR,
}

export interface IRilogInput {
    type: RilogInputEvent;
    value: string;
    nodeName: string;
    className: string;
    id: string;
    name: string;
    inputType: string;
}
