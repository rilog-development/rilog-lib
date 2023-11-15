import { SUCCESS_RESPONSE_STATUS_START_CODE } from '../constants';
import { IRilogRequest, IRilogResponse, TRilogPushRequest, TRilogPushResponse } from '../types';
import { getQueryParamsFromUrl } from '../utils/transforms';

const checkEmptyRequest = (request: IRilogRequest): boolean => {
    let empty = false;

    !request.url && (empty = true);
    !request.method && (empty = true);

    return empty;
};

const fetchAdapterRequest = (data: TRilogPushRequest) => {
    const queryParams = getQueryParamsFromUrl(data.url);

    const requestFull: IRilogRequest = {
        url: data.url,
        method: data.options?.method || 'GET',
        headers: data.options?.headers || {},
        data: data.options?.method ? data.options?.data : queryParams || {},
        locationOrigin: null,
        locationHref: null,
        localStorage: null,
    };

    console.log('[fetchAdapterRequest] requestFull', requestFull);

    return checkEmptyRequest(requestFull) ? null : requestFull;
};

const fetchAdapterResponse = (data: TRilogPushResponse) => {
    if (Object.keys(data).length === 0) {
        return null;
    }

    const responseFull: IRilogResponse = {
        data: data.data || 'No data.',
        status: data.status || null,
    };

    return responseFull;
};

export { fetchAdapterRequest, fetchAdapterResponse };
