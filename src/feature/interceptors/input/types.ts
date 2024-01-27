import { IRilogEventItem } from '../../../types/events';

export interface IRilogInputInterceptor {
    getInputEvent: (event: any, type: RilogInputEvent) => IRilogEventItem;
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
}
