import { SUCCESS_RESPONSE_STATUS_START_CODE } from '../constants';
import { IRilogRequest, IRilogResponse, TRilogPushRequest, TRilogPushResponse } from '../types';

const checkEmptyRequest = (request: IRilogRequest): boolean => {
    let empty = false;

    !request.url && (empty = true);
    !request.method && (empty = true);
    !request.headers && (empty = true);

    return empty;
};

const fetchAdapterRequest = (data: TRilogPushRequest) => {
    console.log('[fetchAdapterRequest] data', data);
    let requestFull: IRilogRequest = {
        url: '',
        method: '',
        headers: {},
        data: {},
        locationOrigin: null,
        locationHref: null,
        localStorage: null,
    };

    data?.url && (requestFull = { ...requestFull, url: data.url });
    data?.config && (requestFull = { ...requestFull, data: data.config });

    return data;
};

const checkEmptyResponse = (response: IRilogResponse): boolean => {
    let empty = false;

    Object.keys(response.data).length === 0 && (empty = true);

    return empty;
};

const fetchAdapterResponse = (data: TRilogPushResponse) => {
    console.log('[fetchAdapterResponse] data ', data, 'data.data ', data.data, 'data.body ', data.body);

    let responseFull: IRilogResponse = {
        data: {},
        status: null,
    };

    if (Object.keys(data).length === 0) {
        return null;
    }

    if (data?.status?.toString()[0] !== SUCCESS_RESPONSE_STATUS_START_CODE) {
        return { data: data.response.data, status: data.status?.toString() };
    }

    if (data?.data) {
        responseFull = {
            ...responseFull,
            data: data.data,
            status: data?.response?.status?.toString() || data?.status?.toString() || null,
        };
    }

    return checkEmptyResponse(responseFull) ? null : responseFull;
};

export { fetchAdapterRequest, fetchAdapterResponse };
