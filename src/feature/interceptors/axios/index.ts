import { TRilogPushRequest, TRilogPushResponse } from '../../../types';
import { pushRequest, pushResponse } from '../../requests';
import AxiosAdapter from './adapter';
import { IAxiosAdapter, IAxiosInterceptor } from './types';

class AxiosInterceptor implements IAxiosInterceptor {

    private adapter: IAxiosAdapter;

    constructor (axisAdapter: AxiosAdapter) {
        this.adapter = axisAdapter
    }

    onRequest (data: TRilogPushRequest) {
        const preparedRequest = this.adapter.getRequest(data);

        if (!preparedRequest) return;
    
        pushRequest(preparedRequest);
    };

    onResponse (data: TRilogPushResponse) {
        const preparedResponse = this.adapter.getResponse(data);

        if (!preparedResponse) return;

        pushResponse(preparedResponse);
    }
};

export default AxiosInterceptor;
