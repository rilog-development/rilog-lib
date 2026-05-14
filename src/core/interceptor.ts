import { saveEventsCustom, saveEventsToRilog } from '../api';
import { EVENTS_ARRAY_LIMIT, LOCAL_BASE_URL, LONG_TIMER_LIMIT, REQUEST_TIMEOUT_LIMIT } from '../constants';
import ClickInterceptor from '../feature/interceptors/click';
import { IRilogClickInterceptor } from '../feature/interceptors/click/types';
import { isButtonElement } from '../feature/interceptors/click/utils';
import ConsoleInterceptor from '../feature/interceptors/console';
import { IRilogConsoleInterceptor } from '../feature/interceptors/console/types';
import MessageInterceptor from '../feature/interceptors/message';
import { IRilogMessageConfig, IRilogMessageInterceptor } from '../feature/interceptors/message/types';
import { IRilogRequest, IRilogRequestItem, IRilogRequestTimed, IRilogResponse, TRilogInitConfig, TRilogState } from '../types';
import { ERilogEvent, IRilogEventItem } from '../types/events';
import { IRilogFilterRequest } from '../types/filterRequest';
import { IRilogInterceptror, TSendEvents } from '../types/interceptor';
import { IEventStorage } from '../types/storage';
import { IRilogTimer } from '../types/timer';
import { generateUniqueId, getLocation } from '../utils';
import IDBStorage from '../utils/IDBStorage';
import RilogFilterRequest from './filterRequest';
import RilogTimer from './timer';
import { isUrlIgnored } from '../utils/filters';
import QueueArray from '../utils/queque';
import { Queue } from '../types/queque';

class RilogInterceptor implements IRilogInterceptror {
    private clickInterceptor: IRilogClickInterceptor;
    private messageInterceptor: IRilogMessageInterceptor;
    private consoleInterceptor: IRilogConsoleInterceptor;
    private timer: IRilogTimer;
    private filter: IRilogFilterRequest;
    private config: TRilogInitConfig | null = null;
    private requestsQueue: Queue<IRilogRequestTimed>;
    private requestTimeouts: Map<IRilogRequestTimed, ReturnType<typeof setTimeout>> = new Map();
    private storage: IEventStorage;
    private isSending = false;

    public init: TRilogState['init'] = false;
    public token: TRilogState['token'] = null;
    public uToken: string | null = null;

    constructor(config: TRilogInitConfig | null) {
        this.config = config;
        this.timer = new RilogTimer();
        this.filter = new RilogFilterRequest(config);
        this.clickInterceptor = new ClickInterceptor();
        this.messageInterceptor = new MessageInterceptor();
        this.consoleInterceptor = new ConsoleInterceptor();
        this.requestsQueue = new QueueArray();
        this.storage = new IDBStorage();

        if (!config?.disableClickInterceptor) window.document.addEventListener('click', this.onClick.bind(this));
        if (!config?.disableConsoleInterceptor) this.consoleInterceptor.start(this.pushEvents.bind(this));
    }

    onLogData<T>(data: T, config: IRilogMessageConfig, stackTrace?: string): void {
        const messageEvent = this.messageInterceptor?.getMessageEvent(data, config, stackTrace);
        this.pushEvents(messageEvent).catch(() => {});
    }

    onClick(event: any) {
        if (this.config?.disableClickInterceptor) return;
        if (isButtonElement(event)) {
            const clickEvent = this.clickInterceptor?.getClickEvent(event);
            clickEvent && this.pushEvents(clickEvent).catch(() => {});
        }
    }

    onRequest(request: IRilogRequest) {
        const timedRequest: IRilogRequestTimed | null = request
            ? {
                  ...request,
                  timestamp: Date.now(),
                  location: getLocation(),
                  localStorage: JSON.stringify(localStorage),
              }
            : null;

        if (!timedRequest) return;

        const isSelfServerRequest = this.config?.selfServer ? isUrlIgnored(timedRequest.url, [this.config?.selfServer.url]) : false;
        if (isSelfServerRequest) return;
        if (this.filter.isLibruaryRequest(timedRequest) || this.filter.isIgnoredRequest(timedRequest)) return;

        const preparedRequest = this.filter.getRequests(timedRequest) || null;
        if (!preparedRequest) return;

        this.requestsQueue.enqueue(preparedRequest);

        const timeoutId = setTimeout(() => {
            const removed = this.requestsQueue.dequeueItem(preparedRequest);
            if (removed) this.recordTimedOutRequest(removed).catch(() => {});
            this.requestTimeouts.delete(preparedRequest);
        }, REQUEST_TIMEOUT_LIMIT);

        this.requestTimeouts.set(preparedRequest, timeoutId);
    }

    async onResponse(response: IRilogResponse | null) {
        const request = response && this.requestsQueue.dequeue('url', response.url);
        if (!request) return;

        const timeoutId = this.requestTimeouts.get(request);
        if (timeoutId) {
            clearTimeout(timeoutId);
            this.requestTimeouts.delete(request);
        }

        const fullRequest: IRilogRequestItem = {
            _id: generateUniqueId(),
            request,
            response: { ...response, timestamp: Date.now() },
        };

        this.timer.clearLong();

        await this.pushEvents({
            _id: generateUniqueId(),
            type: ERilogEvent.REQUEST,
            date: fullRequest.request.timestamp.toString(),
            data: fullRequest,
            location: fullRequest.request.location,
        });
    }

    private combineNotResolverRequests(events: IRilogEventItem[], olderThanMs?: number): IRilogEventItem[] {
        const notResolvedRequests = this.requestsQueue.dequeueNotResolved(olderThanMs);

        const fullNotResolvedRequests: IRilogEventItem[] | undefined = notResolvedRequests?.map((request) => ({
            _id: generateUniqueId(),
            type: ERilogEvent.REQUEST,
            date: request.timestamp.toString(),
            data: {
                _id: generateUniqueId(),
                request,
                response: {
                    data: "Interceptor haven't got any response. Timeout.",
                    status: '',
                    url: '',
                    timestamp: Date.now(),
                },
            },
            location: request.location,
        }));

        return fullNotResolvedRequests ? [...events, ...fullNotResolvedRequests] : [...events];
    }

    private async recordTimedOutRequest(request: IRilogRequestTimed) {
        await this.pushEvents({
            _id: generateUniqueId(),
            type: ERilogEvent.REQUEST,
            date: request.timestamp.toString(),
            data: {
                _id: generateUniqueId(),
                request,
                response: {
                    data: "Interceptor haven't got any response. Timeout.",
                    status: '',
                    url: '',
                    timestamp: Date.now(),
                },
            },
            location: request.location,
        });
    }

    private async pushEvents(data: IRilogEventItem) {
        if (this.config?.onPushEvent) this.config.onPushEvent(data);

        await this.storage.push(data);

        const count = await this.storage.count();

        if (count > EVENTS_ARRAY_LIMIT && this.requestsQueue.isEmpty()) {
            const stored = await this.storage.getAll();
            const fullEvents = this.combineNotResolverRequests(stored, LONG_TIMER_LIMIT);
            await this.saveEvents(fullEvents, stored.map((e) => e._id));
            return;
        }

        if (!this.init) return;

        this.timer.startLong(async () => {
            const stored = await this.storage.getAll();
            const fullEvents = this.combineNotResolverRequests(stored, LONG_TIMER_LIMIT);
            await this.saveEvents(fullEvents, stored.map((e) => e._id));
        });
    }

    private async saveEvents(data: IRilogEventItem[], idsToDelete: string[]) {
        if (this.isSending) return;
        this.isSending = true;

        try {
            if (this.config?.onSaveEvents) this.config.onSaveEvents(data);

            const sortedEvents = this.filter.sortEventsByDate(data);
            const result = await this.sendEvents({ data: JSON.stringify(sortedEvents), token: this.token || '', localServer: this.config?.localServer, selfServer: this?.config?.selfServer });

            this.timer.clearLong();

            if (result?.result?.toLowerCase() === 'success') {
                await this.storage.clearByIds(idsToDelete);
            }
        } finally {
            this.isSending = false;
        }
    }

    private async sendEvents({ data, token, localServer, selfServer }: TSendEvents) {
        if (localServer) {
            return saveEventsCustom({ data: JSON.stringify({ events: data, uToken: this.uToken, ...this.config?.localServer }), url: `${LOCAL_BASE_URL}/api/events/save` });
        }

        if (selfServer) {
            return saveEventsCustom({ data: JSON.stringify({ events: data }), url: selfServer.url, headers: selfServer.headers });
        }

        return saveEventsToRilog(data, token);
    }
}

export default RilogInterceptor;
