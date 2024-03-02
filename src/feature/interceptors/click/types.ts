import { IRilogEventItem } from '../../../types/events';

/**
 * !!!Should be updated with BACKEND types
 */
export interface IRilogClick {
    id: string;
    inner: string;
    nodeName: string;
    classNames: string;
}

export interface IRilogClickInterceptor {
    getClickEvent(event: any): IRilogEventItem | undefined;
}
