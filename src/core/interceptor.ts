import { saveEvents } from '../api';
import { EVENTS_ARRAY_LIMIT, RIL_EVENTS } from '../constants';
import ClickInterceptor from '../feature/interceptors/click';
import { IRilogClickInterceptor } from '../feature/interceptors/click/types';
import { defaultState } from '../feature/interceptors/constants';
import InputInterceptor from '../feature/interceptors/input';
import { IRilogInputInterceptor, RilogInputEvent } from '../feature/interceptors/input/types';
import { isInputElement } from '../feature/interceptors/input/utils';
import MessageInterceptor from '../feature/interceptors/message';
import { IRilogMessageConfig, IRilogMessageInterceptor } from '../feature/interceptors/message/types';
import { IRilogRequest, IRilogRequestItem, IRilogRequestTimed, IRilogResponse, IRilogResponseTimed, TRilogInitConfig, TRilogState, TUpdateStateFn } from '../types';
import { ERilogEvent, IRilogEventItem } from '../types/events';
import { IRilogFilterRequest } from '../types/filterRequest';
import { IRilogInterceptorState, IRilogInterceptror } from '../types/interceptor';
import { IRilogTimer } from '../types/timer';
import { getLocation } from '../utils';
import { encrypt } from '../utils/encrypt';
import RilogFilterRequest from './filterRequest';
import RilogTimer from './timer';

class RilogInterceptor implements IRilogInterceptror {
    private clickInterceptor: IRilogClickInterceptor;
    private inputInterceptor: IRilogInputInterceptor;
    private messageInterceptor: IRilogMessageInterceptor;
    private timer: IRilogTimer;
    private filter: IRilogFilterRequest;
    public salt: TRilogState['salt'] = null;
    public token: TRilogState['token'] = null;
    public state: IRilogInterceptorState = defaultState;

    constructor(config: TRilogInitConfig | null) {
        this.timer = new RilogTimer();
        this.filter = new RilogFilterRequest(config);
        this.clickInterceptor = new ClickInterceptor();
        this.messageInterceptor = new MessageInterceptor();
        this.inputInterceptor = new InputInterceptor();

        window.document.addEventListener('click', this.onClick.bind(this));

        window.document.addEventListener('blur', this.onInput.bind(this));
    }

    onSaveData<T>(data: T, config: IRilogMessageConfig): void {
        const messageEvent = this.messageInterceptor?.getMessageEvent(data, config);

        this.pushEvents(messageEvent);
    }

    onClick(event: any) {
        const clickEvent = this.clickInterceptor?.getClickEvent(event);

        this.pushEvents(clickEvent);
    }

    onInput(event: any): void {
        if (isInputElement(event)) {
            const inputEvent = this.inputInterceptor?.getInputEvent(event, RilogInputEvent.BLUR);

            this.pushEvents(inputEvent);
        }
    }

    onRequest(request: IRilogRequest) {
        const timedRequest: IRilogRequestTimed | null = request
            ? {
                  ...request,
                  timestamp: Date.now(),
                  // should be defined in request time
                  location: getLocation(),
                  localStorage: JSON.stringify(localStorage),
              }
            : null;

        /**
         * Shor timer is used only for interception request-response. It's time without any response from server.
         */
        this.timer.startShort(() => {
            this.onResponse({});
        });

        if (!timedRequest) return;

        if (this.filter.isLibruaryRequest(timedRequest)) return;

        this.state.request = this.filter.getRequests(timedRequest) || null;
    }

    async onResponse(response: IRilogResponse) {
        /**
         * Init full request variable which includes full request and response data.
         */
        let fullRequest: IRilogRequestItem | null = null;

        const timedResponse: IRilogResponseTimed | null = response ? { ...response, timestamp: Date.now() } : null;

        this.timer.clearShort();

        /**
         * Can't prepare any response without request.
         */
        if (!this.state.request) return;

        fullRequest = timedResponse
            ? {
                  _id: Date.now().toString(),
                  request: this.state.request,
                  response: timedResponse,
              }
            : {
                  _id: Date.now().toString(),
                  request: this.state.request,
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

        await this.pushEvents({
            _id: fullRequest._id,
            type: ERilogEvent.REQUEST,
            date: fullRequest.request.timestamp.toString(),
            data: fullRequest,
            location: fullRequest.request.location,
        });

        /**
         * Clear request data
         */
        this.state.request = null;
    }

    private async pushEvents(data: IRilogEventItem) {
        const events: string | null = localStorage.getItem(RIL_EVENTS);

        const eventsArray: IRilogEventItem[] = events ? JSON.parse(events) : [];

        if (eventsArray) {
            eventsArray.push(data);

            if (eventsArray.length > EVENTS_ARRAY_LIMIT) {
                await this.saveEvents(eventsArray);
            } else {
                localStorage.removeItem(RIL_EVENTS);
                localStorage.setItem(RIL_EVENTS, JSON.stringify(eventsArray));

                /**
                 * Leave function if lib isn't init
                 * (Lib got salt and token from backend on init request)
                 */
                if (!this.salt && !this.token) return;

                this.timer.startLong(async () => {
                    await this.saveEvents(eventsArray);
                });
            }
        } else {
            localStorage.setItem(RIL_EVENTS, JSON.stringify([data]));
        }
    }

    private async saveEvents(data: IRilogEventItem[]) {
        const encryptedEvents = encrypt(data, this.salt);

        const result = await saveEvents(encryptedEvents, this.token || '');

        this.timer.clearLong();

        if (result?.result?.toLowerCase() === 'success') {
            localStorage.removeItem(RIL_EVENTS);
        }
    }
}

export default RilogInterceptor;
