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
        url: 'Unknown',
        method: 'Unknown',
        headers: {},
        data: {},
        locationOrigin: null,
        locationHref: null,
        localStorage: null,
    };

    data?.url && (requestFull = { ...requestFull, url: data.url });
    data?.config && (requestFull = { ...requestFull, data: data.config });

    return checkEmptyRequest(requestFull) ? null : requestFull;
};

const fetchAdapterResponse = (data: TRilogPushResponse) => {
    console.log('[fetchAdapterResponse] data ', data);

    const responseData = data.json();

    console.log('[fetchAdapterResponse] responseData ', responseData);

    if (Object.keys(data).length === 0) {
        return null;
    }

    const responseFull: IRilogResponse = {
        data: responseData || 'No data.',
        status: data?.response?.status?.toString() || data?.status?.toString() || null,
    };

    console.log('[fetchAdapterResponse] responseFull ', responseFull);

    return responseFull;
};

export { fetchAdapterRequest, fetchAdapterResponse };
