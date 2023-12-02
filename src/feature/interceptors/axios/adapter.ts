import { SUCCESS_RESPONSE_STATUS_START_CODE } from '../../../constants';
import { IRilogRequest, IRilogResponse, TRilogPushRequest, TRilogPushResponse } from '../../../types/requests';
import { IAxiosAdapter } from './types';

class AxiosAdapter implements IAxiosAdapter {

    getRequest(data: TRilogPushRequest) {
        let requestFull: IRilogRequest = {
            url: '',
            method: '',
            headers: {},
            data: {},
            locationOrigin: null,
            locationHref: null,
            localStorage: null,
        };
        // Fill Request data
        data?.url && (requestFull = { ...requestFull, url: data.url });
        data?.method && (requestFull = { ...requestFull, method: data.method });
        data?.headers && (requestFull = { ...requestFull, headers: data.headers });
        data?.data && (requestFull = { ...requestFull, data: data.data });
        data?.params && (requestFull = { ...requestFull, data: { ...requestFull.data, ...data.params } });

        return this.checkEmptyRequest(requestFull) ? null : requestFull;
    }

    getResponse(data: TRilogPushResponse) {
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

        return this.checkEmptyResponse(responseFull) ? null : responseFull;
    }

    private checkEmptyRequest(request: IRilogRequest): boolean {
        let empty = false;

        !request.url && (empty = true);
        !request.method && (empty = true);
        !request.headers && (empty = true);

        return empty;
    }

    private checkEmptyResponse(response: IRilogResponse): boolean {
        let empty = false;

        Object.keys(response.data).length === 0 && (empty = true);

        return empty;
    }
}

export default AxiosAdapter;
