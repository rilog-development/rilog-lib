import { TRilogPushRequest, TRilogPushResponse } from '../types';

const fetchAdapterRequest = (data: TRilogPushRequest) => {
    console.log("[fetchAdapterRequest] data", data);
    return data;
};

const fetchAdapterResponse = (data: TRilogPushResponse) => {
    console.log("[fetchAdapterResponse] data", data);
    return data;
};

export { fetchAdapterRequest, fetchAdapterResponse };
