import { saveEventsCustom, saveEventsToRilog } from '../api';
import { BASE_URL, DEFAULT_LOCAL_URL, EVENTS_ARRAY_LIMIT, LONG_TIMER_LIMIT, REQUEST_TIMEOUT_LIMIT } from '../constants';
import ClickInterceptor from '../feature/interceptors/click';
import { IRilogClickInterceptor } from '../feature/interceptors/click/types';
import { isButtonElement } from '../feature/interceptors/click/utils';
import ConsoleInterceptor from '../feature/interceptors/console';
import { IRilogConsoleInterceptor } from '../feature/interceptors/console/types';
import InputInterceptor from '../feature/interceptors/input';
import { IRilogInputInterceptor } from '../feature/interceptors/input/types';
import MessageInterceptor from '../feature/interceptors/message';
import { IRilogMessageConfig, IRilogMessageInterceptor } from '../feature/interceptors/message/types';
import { IRilogRequest, IRilogRequestItem, IRilogRequestTimed, IRilogResponse, TRilogInitConfig, TRilogState } from '../types';
import { ERilogEvent, IRilogEventItem } from '../types/events';
import { IRilogFilterRequest } from '../types/filterRequest';
import { IRilogInterceptror, TSendEvents } from '../types/interceptor';
import { IEventStorage } from '../types/storage';
import { IRilogTimer } from '../types/timer';
import { generateUniqueId, getDeviceInfo, getLocation } from '../utils';
import { TDeviceInfo } from '../types/core';
import IDBStorage from '../utils/IDBStorage';
import RilogFilterRequest from './filterRequest';
import RilogTimer from './timer';
import { isUrlIgnored } from '../utils/filters';
import QueueArray from '../utils/queque';
import { Queue } from '../types/queque';

class RilogInterceptor implements IRilogInterceptror {
    private clickInterceptor: IRilogClickInterceptor;
    private inputInterceptor: IRilogInputInterceptor;
    private messageInterceptor: IRilogMessageInterceptor;
    private consoleInterceptor: IRilogConsoleInterceptor;
    private timer: IRilogTimer;
    private filter: IRilogFilterRequest;
    private config: TRilogInitConfig | null = null;
    private requestsQueue: Queue<IRilogRequestTimed>;
    private requestTimeouts: Map<IRilogRequestTimed, ReturnType<typeof setTimeout>> = new Map();
    private storage: IEventStorage;
    private eventsCache: IRilogEventItem[] = [];
    private isSending = false;
    private deviceInfo: TDeviceInfo;

    public init: TRilogState['init'] = false;
    public token: TRilogState['token'] = null;
    public uToken: string | null = null;

    constructor(config: TRilogInitConfig | null) {
        this.config = config;
        this.timer = new RilogTimer();
        this.filter = new RilogFilterRequest(config);
        this.clickInterceptor = new ClickInterceptor();
        this.inputInterceptor = new InputInterceptor();
        this.messageInterceptor = new MessageInterceptor();
        this.consoleInterceptor = new ConsoleInterceptor();
        this.requestsQueue = new QueueArray();
        this.storage = new IDBStorage();
        this.deviceInfo = getDeviceInfo();

        if (!config?.disableClickInterceptor) window.document.addEventListener('click', this.onClick.bind(this));
        if (!config?.disableConsoleInterceptor) this.consoleInterceptor.start(this.pushEvents.bind(this));
        if (!config?.disableInputInterceptor) this.inputInterceptor.start(this.pushEvents.bind(this));

        window.addEventListener('beforeunload', this.onBeforeUnload.bind(this));
    }

    onLogData<T>(data: T, config: IRilogMessageConfig, stackTrace?: string): void {
        const messageEvent = this.messageInterceptor?.getMessageEvent(data, config, stackTrace);
        this.pushEvents(messageEvent).catch((err: unknown) => {
            console.warn('[Rilog-lib]', err);
        });
    }

    onClick(event: any) {
        if (this.config?.disableClickInterceptor) return;
        if (isButtonElement(event)) {
            const clickEvent = this.clickInterceptor?.getClickEvent(event);
            clickEvent &&
                this.pushEvents(clickEvent).catch((err: unknown) => {
                    console.warn('[Rilog-lib]', err);
                });
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
            if (removed)
                this.recordTimedOutRequest(removed).catch((err: unknown) => {
                    console.warn('[Rilog-lib]', err);
                });
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

        try {
            await this.storage.push(data);
        } catch {
            return;
        }

        this.eventsCache.push(data);

        const count = await this.storage.count();

        if (count > EVENTS_ARRAY_LIMIT && this.requestsQueue.isEmpty()) {
            const stored = await this.storage.getAll();
            const fullEvents = this.combineNotResolverRequests(stored, LONG_TIMER_LIMIT);
            await this.saveEvents(
                fullEvents,
                stored.map((e) => e._id),
            );
            return;
        }

        if (!this.init) return;

        this.timer.startLong(async () => {
            const stored = await this.storage.getAll();
            const fullEvents = this.combineNotResolverRequests(stored, LONG_TIMER_LIMIT);
            await this.saveEvents(
                fullEvents,
                stored.map((e) => e._id),
            );
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
                const deletedIds = new Set(idsToDelete);
                this.eventsCache = this.eventsCache.filter((e) => !deletedIds.has(e._id));
            }
        } finally {
            this.isSending = false;
        }
    }

    private async sendEvents({ data, token, localServer, selfServer }: TSendEvents) {
        if (localServer) {
            const { url: localUrl, ...localServerData } = localServer;
            return saveEventsCustom({
                data: JSON.stringify({ events: data, uToken: this.uToken, deviceInfo: this.deviceInfo, ...localServerData }),
                url: `${localUrl || DEFAULT_LOCAL_URL}/api/events/save`,
            });
        }

        if (selfServer) {
            return saveEventsCustom({ data: JSON.stringify({ events: data, deviceInfo: this.deviceInfo }), url: selfServer.url, headers: selfServer.headers });
        }

        return saveEventsToRilog(data, token);
    }

    private onBeforeUnload() {
        if (!this.eventsCache.length || !this.init) return;

        const sorted = this.filter.sortEventsByDate([...this.eventsCache]);
        const eventsData = JSON.stringify(sorted);

        if (this.config?.localServer) {
            const { url: localUrl, ...localServerData } = this.config.localServer;
            const payload = new Blob([JSON.stringify({ events: eventsData, uToken: this.uToken, deviceInfo: this.deviceInfo, ...localServerData })], { type: 'application/json' });
            navigator.sendBeacon && navigator.sendBeacon(`${localUrl || DEFAULT_LOCAL_URL}/api/events/save`, payload);
            return;
        }

        if (this.config?.selfServer) {
            const payload = new Blob([JSON.stringify({ events: eventsData, deviceInfo: this.deviceInfo })], { type: 'application/json' });
            navigator.sendBeacon && navigator.sendBeacon(this.config.selfServer.url, payload);
            return;
        }

        // Rilog cloud — fetch with keepalive supports Authorization header
        if (this.token) {
            fetch(`${BASE_URL}/connection/send`, {
                method: 'POST',
                keepalive: true,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.token}` },
                body: JSON.stringify({ eventsData }),
            }).catch((err: unknown) => {
                console.warn('[Rilog-lib]', err);
            });
        }
    }
}

export default RilogInterceptor;
