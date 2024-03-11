import { saveEventsCustom, saveEventsToRilog } from '../api';
import { EVENTS_ARRAY_LIMIT, LOCAL_BASE_URL, MAX_EVENTS_SIZE_MB, MAX_LOCAL_STORAGE_SIZE, RIL_EVENTS } from '../constants';
import ClickInterceptor from '../feature/interceptors/click';
import { IRilogClickInterceptor } from '../feature/interceptors/click/types';
import { isButtonElement } from '../feature/interceptors/click/utils';
import { defaultState } from '../feature/interceptors/constants';
import MessageInterceptor from '../feature/interceptors/message';
import { IRilogMessageConfig, IRilogMessageInterceptor } from '../feature/interceptors/message/types';
import { IRilogRequest, IRilogRequestItem, IRilogRequestTimed, IRilogResponse, IRilogResponseTimed, TRilogInitConfig, TRilogState } from '../types';
import { ERilogEvent, IRilogEventItem } from '../types/events';
import { IRilogFilterRequest } from '../types/filterRequest';
import { IRilogInterceptorState, IRilogInterceptror, TSendEvents } from '../types/interceptor';
import { IRilogTimer } from '../types/timer';
import { generateUniqueId, getLocation } from '../utils';
import { encrypt } from '../utils/encrypt';
import RilogFilterRequest from './filterRequest';
import RilogTimer from './timer';
import { isUrlIgnored } from '../utils/filters';
import { calculateLocalStorageSizeInMB, calculateLocalStorageValueSizeInMB, calculateStringSizeInMB } from '../utils/storage';

class RilogInterceptor implements IRilogInterceptror {
    private clickInterceptor: IRilogClickInterceptor;
    private messageInterceptor: IRilogMessageInterceptor;
    private timer: IRilogTimer;
    private filter: IRilogFilterRequest;
    private config: TRilogInitConfig | null = null;
    public init: TRilogState['init'] = false;
    public salt: TRilogState['salt'] = null;
    public token: TRilogState['token'] = null;
    public uToken: string | null = null;
    public state: IRilogInterceptorState = defaultState;

    constructor(config: TRilogInitConfig | null) {
        this.config = config;
        this.timer = new RilogTimer();
        this.filter = new RilogFilterRequest(config);
        this.clickInterceptor = new ClickInterceptor();
        this.messageInterceptor = new MessageInterceptor();

        /**
         * The click interception can be disabled by user from config.
         */
        if (!config?.disableClickInterceptor) window.document.addEventListener('click', this.onClick.bind(this));
    }

    onSaveData<T>(data: T, config: IRilogMessageConfig): void {
        const messageEvent = this.messageInterceptor?.getMessageEvent(data, config);

        this.pushEvents(messageEvent);
    }

    onClick(event: any) {
        if (this.config?.disableClickInterceptor) return;

        if (isButtonElement(event)) {
            const clickEvent = this.clickInterceptor?.getClickEvent(event);

            clickEvent && this.pushEvents(clickEvent);
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

        /**
         * Check if request was to self server and skip onRequest if true (this req shouldn't be logged).
         */
        const isSelfServerRequest = this.config?.selfServer ? isUrlIgnored(timedRequest.url, [this.config?.selfServer.url]) : false;

        if (isSelfServerRequest) return;

        if (this.filter.isLibruaryRequest(timedRequest) || this.filter.isIgnoredRequest(timedRequest)) return;

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
        console.log('[Rilog-lib] (onResponse) request ', this.state.request, 'response ', response);
        if (!this.state.request) return;

        fullRequest = timedResponse
            ? {
                  _id: generateUniqueId(),
                  request: this.state.request,
                  response: timedResponse,
              }
            : {
                  _id: generateUniqueId(),
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
            _id: generateUniqueId(),
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
        /**
         * User can intercept push events to array using callback from config.
         */
        if (this.config?.onPushEvent) this.config?.onPushEvent(data);

        const events: string | null = localStorage.getItem(RIL_EVENTS);

        const eventsArray: IRilogEventItem[] = events ? JSON.parse(events) : [];

        if (eventsArray) {
            const updatedEventsArray = [...eventsArray, data];

            const shouldSendEvents = await this.shouldSendEvents(JSON.stringify(data), JSON.stringify(eventsArray));

            if (shouldSendEvents || updatedEventsArray.length > EVENTS_ARRAY_LIMIT) {
                await this.saveEvents(updatedEventsArray);
            } else {
                localStorage.removeItem(RIL_EVENTS);
                localStorage.setItem(RIL_EVENTS, JSON.stringify(updatedEventsArray));

                /**
                 * Leave function if lib isn't init
                 * (Lib got salt and token from backend on init request)
                 */
                if (!this.init) return;

                this.timer.startLong(async () => {
                    await this.saveEvents(updatedEventsArray);
                });
            }
        } else {
            localStorage.setItem(RIL_EVENTS, JSON.stringify([data]));
        }
    }

    private async saveEvents(data: IRilogEventItem[]) {
        /**
         * Users can intercept events using callback from config.
         */
        if (this.config?.onSaveEvents) this.config?.onSaveEvents(data);

        /**
         * Sort events by timestamp.
         * For case when request was initiated earlier then click event happend.
         */
        const sortedEvents = this.filter.sortEventsByDate(data);

        /**
         * Encrypt array of events for safety pushing it to server.
         *
         * If got salt - would be encrypted with CryptoJS.
         * Without salt - would be convert to base64.
         */
        const encryptedEvents = encrypt(sortedEvents, this.salt);

        const result = await this.sendEvents({ data: encryptedEvents, token: this.token || '', localServer: this.config?.localServer, selfServer: this?.config?.selfServer });

        this.timer.clearLong();

        if (result?.result?.toLowerCase() === 'success') {
            localStorage.removeItem(RIL_EVENTS);
        }
    }

    /**
     * Define the send events methods using some config params.
     * @param {TSendEvents}
     * @returns {Promise}
     */
    private async sendEvents({ data, token, localServer, selfServer }: TSendEvents) {
        /**
         * The priority method for saving is local :)
         */
        if (localServer) {
            return saveEventsCustom({ data: JSON.stringify({ events: data, uToken: this.uToken, ...this.config?.localServer }), url: `${LOCAL_BASE_URL}/api/events/save` });
        }

        if (selfServer) {
            return saveEventsCustom({ data: JSON.stringify({ events: data }), url: selfServer.url, headers: selfServer.headers });
        }

        return saveEventsToRilog(data, token);
    }

    /**
     * Check the need to send events to backend storage.
     * @param event {string} - parsed to string created rilog event
     * @param events {string} - parsed to string array of rilog events
     * @private
     * @return {boolean}
     */
    private async shouldSendEvents(event: string, events: string) {
        const eventSize = calculateStringSizeInMB(event);

        const localStorageSize = await calculateLocalStorageSizeInMB();
        console.log('[Rilog-lib] localStorageSize ', localStorageSize);
        const freeLocalStorageSpace = MAX_LOCAL_STORAGE_SIZE - localStorageSize;
        console.log('[Rilog-lib] freeLocalStorageSpace ', freeLocalStorageSpace);

        if (eventSize >= freeLocalStorageSpace) return true;

        const localStorageEventsSize = calculateStringSizeInMB(events);

        console.log('[Rilog-lib] events size ', localStorageEventsSize + eventSize);
        if (localStorageEventsSize + eventSize > MAX_EVENTS_SIZE_MB) return true;

        return false;
    }
}

export default RilogInterceptor;
