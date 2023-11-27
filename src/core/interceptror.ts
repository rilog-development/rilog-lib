import { saveRequest } from "../api";
import { REQUESTS_ARRAY_LIMIT, RIL_REQUESTS } from "../constants";
import { IRilogRequest, IRilogRequestItem, IRilogRequestTimed, IRilogResponse, IRilogResponseTimed, TRilogInitConfig, TUpdateStateFn } from "../types";
import { IRilogFilterRequest } from "../types/filterRequest";
import { IRilogInterceptror } from "../types/interceptor";
import { IRilogTimer } from "../types/timer";
import { encrypt } from "../utils/encrypt";
import RilogFilterRequest from "./filterRequest";
import RilogTimer from "./timer";

class RilogInterceptor implements IRilogInterceptror {
    private timer: IRilogTimer;
    private filter: IRilogFilterRequest;
    private config: TRilogInitConfig | null;

    constructor(config: TRilogInitConfig | null) {
        this.config = config;
        this.timer = new RilogTimer();
        this.filter = new RilogFilterRequest(config);
    }

    async prepareRequest(request: IRilogRequest) {
        const timedRequest: IRilogRequestTimed | null = request
        ? {
              ...request,
              timestamp: Date.now(),
              locationOrigin: window.location?.origin || null,
              locationHref: window.location?.href || null,
              localStorage: JSON.stringify(localStorage),
          }
        : null;

        this.timer.startShort(() => {
            this.prepareResponse({}, timedRequest);
        });

        if (!timedRequest) return;

        if (this.filter.isLibruaryRequest(timedRequest)) return;

        return this.filter.getRequests(timedRequest);

    }

    async prepareResponse(response: IRilogResponse, request: IRilogRequestTimed | null): Promise<IRilogRequestItem | null> {
        /**
         * Init full request variable which includes full request and response data.
         */
        let fullRequest: IRilogRequestItem | null = null;

        const timedResponse: IRilogResponseTimed | null = response ? { ...response, timestamp: Date.now() } : null;

        this.timer.clearShort();

        /**
         * Can't prepare any response without request.
         */
        if (!request) return null;

        /**
         * Clear long timer which was started after pushing request data to server.
         */
        this.timer.clearLong();

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

        await this.pushRequests(fullRequest);

        return fullRequest;
    }

    private pushRequests(data: IRilogRequestItem) {
        const requests: string | null = localStorage.getItem(RIL_REQUESTS);

        const requestArray: IRilogRequestItem[] = requests ? JSON.parse(requests) : [];

        if (requestArray) {
            requestArray.push(data);
    
            if (requestArray.length > REQUESTS_ARRAY_LIMIT) {
                this.saveRequests(requestArray);
            } else {
                localStorage.removeItem(RIL_REQUESTS);
                localStorage.setItem(RIL_REQUESTS, JSON.stringify(requestArray));
    
                this.timer.startLong(() => {
                    this.saveRequests(requestArray);
                });
            }
        } else {
            localStorage.setItem(RIL_REQUESTS, JSON.stringify([data]));
        }
    }

    private async saveRequests(data: IRilogRequestItem[]) {
        const encryptedRequests = encrypt(data);

        const result = await saveRequest(encryptedRequests);
    
        if (result.result.toLowerCase() === 'success') {
            localStorage.removeItem(RIL_REQUESTS);
        }
    }
}

export default RilogInterceptor;