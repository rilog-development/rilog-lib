import { saveRequest } from '../api';
import { REQUESTS_ARRAY_LIMIT, RIL_REQUESTS } from '../constants';
import { IRilogRequest, IRilogRequestItem, IRilogRequestTimed, IRilogResponse, IRilogResponseTimed, TRilogInitConfig, TRilogState, TUpdateStateFn } from '../types';
import { IRilogFilterRequest } from '../types/filterRequest';
import { IRilogInterceptror } from '../types/interceptor';
import { IRilogTimer } from '../types/timer';
import { encrypt } from '../utils/encrypt';
import RilogFilterRequest from './filterRequest';
import RilogTimer from './timer';

class RilogInterceptor implements IRilogInterceptror {
    private timer: IRilogTimer;
    private filter: IRilogFilterRequest;
    private salt: TRilogState['salt'];
    private token: TRilogState['token'];

    constructor(config: TRilogInitConfig | null, salt: TRilogState['salt'], token: TRilogState['token']) {
        console.log('[RilogInterceptor] config ', config, 'salt ', salt, 'token ', token);
        this.timer = new RilogTimer();
        this.filter = new RilogFilterRequest(config);
        this.salt = salt;
        this.token = token;
    }

    async prepareRequest(request: IRilogRequest) {
        console.log('[RilogInterceptor] (prepareRequest) request ', request);

        const timedRequest: IRilogRequestTimed | null = request
            ? {
                  ...request,
                  timestamp: Date.now(),
                  locationOrigin: window.location?.origin || null,
                  locationHref: window.location?.href || null,
                  localStorage: JSON.stringify(localStorage),
              }
            : null;

        console.log('[RilogInterceptor] (prepareRequest) timedRequest ', timedRequest);

        this.timer.startShort(() => {
            console.log('[RilogInterceptor] (startShort) ', this.prepareResponse);
            this.prepareResponse({}, timedRequest);
        });

        if (!timedRequest) return;

        if (this.filter.isLibruaryRequest(timedRequest)) return;

        return this.filter.getRequests(timedRequest);
    }

    async prepareResponse(response: IRilogResponse, request: IRilogRequestTimed | null) {
        console.log('[RilogInterceptor] (prepareResponse) response ', response, 'request ', request);
        /**
         * Init full request variable which includes full request and response data.
         */
        let fullRequest: IRilogRequestItem | null = null;

        const timedResponse: IRilogResponseTimed | null = response ? { ...response, timestamp: Date.now() } : null;

        this.timer.clearShort();

        /**
         * Can't prepare any response without request.
         */
        if (!request) return;

        fullRequest = timedResponse
            ? {
                  _id: Date.now().toString(),
                  request,
                  response: timedResponse,
              }
            : {
                  _id: Date.now().toString(),
                  request,
                  response: {
                      data: 'No response from server. Timeout.',
                      status: '',
                      timestamp: Date.now(),
                  },
              };

        /**
         * Clear long timer which was started after pushing request data to server.
         */
        this.timer.clearLong();

        await this.pushRequests(fullRequest);

        return fullRequest;
    }

    private async pushRequests(data: IRilogRequestItem) {
        const requests: string | null = localStorage.getItem(RIL_REQUESTS);

        const requestArray: IRilogRequestItem[] = requests ? JSON.parse(requests) : [];

        if (requestArray) {
            requestArray.push(data);

            if (requestArray.length > REQUESTS_ARRAY_LIMIT) {
                await this.saveRequests(requestArray);
            } else {
                localStorage.removeItem(RIL_REQUESTS);
                localStorage.setItem(RIL_REQUESTS, JSON.stringify(requestArray));

                this.timer.startLong(async () => {
                    await this.saveRequests(requestArray);
                });
            }
        } else {
            localStorage.setItem(RIL_REQUESTS, JSON.stringify([data]));
        }
    }

    private async saveRequests(data: IRilogRequestItem[]) {
        const encryptedRequests = encrypt(data, this.salt);

        const result = await saveRequest(encryptedRequests, this.token || '');

        if (result.result.toLowerCase() === 'success') {
            localStorage.removeItem(RIL_REQUESTS);
        }
    }
}

export default RilogInterceptor;
