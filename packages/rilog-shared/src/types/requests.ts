import { IRilogLocation } from './events';

export interface IRilogRequests {
    push(data: IRilogRequestItem): void;
    save(data: IRilogRequestItem[]): void;
}

export interface IRilogRequestItem {
    _id: string;
    request: IRilogRequestTimed;
    response: IRilogResponseTimed;
    duration?: null | string;
}

export interface IRilogRequest {
    url: string;
    method: string;
    headers: any;
    data?: any;
    location: IRilogLocation;
    localStorage: string | null;
}

export interface IRilogResponse {
    data?: any;
    url: string;
    status?: string | null;
}

export interface IRilogRequestTimed extends IRilogRequest {
    timestamp: number;
}

export interface IRilogResponseTimed extends IRilogResponse {
    timestamp: number;
}

export type TRilogPushRequest = any;
export type TRilogPushResponse = any;
