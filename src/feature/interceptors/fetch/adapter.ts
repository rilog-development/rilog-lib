import { IRilogRequest, IRilogResponse, TRilogPushRequest, TRilogPushResponse } from '../../../types';
import { getLocation } from '../../../utils';
import { getQueryParamsFromUrl } from '../../../utils/transforms';
import { IFetchAdapter } from './types';

class FetchAdapter implements IFetchAdapter {
    getRequest(data: TRilogPushRequest) {
        const queryParams = getQueryParamsFromUrl(data.url);

        const requestFull: IRilogRequest = {
            url: data.url,
            method: data.options?.method || 'GET',
            headers: data.options?.headers || {},
            data: data.options?.method ? data.options?.data : queryParams || {},
            location: { origin: null, href: null },
            localStorage: null,
        };

        return this.checkEmptyRequest(requestFull) ? null : requestFull;
    }

    getResponse(data: TRilogPushResponse) {
        if (Object.keys(data).length === 0) {
            return null;
        }

        const responseFull: IRilogResponse = {
            data: data.data || 'No data.',
            status: data.status || null,
        };

        return responseFull;
    }

    private checkEmptyRequest(request: IRilogRequest): boolean {
        let empty = false;

        !request.url && (empty = true);
        !request.method && (empty = true);

        return empty;
    }
}

export default FetchAdapter;
