/**
 * Runs in the page's own MAIN world (see manifest.json `"world": "MAIN"`), so it can patch
 * window.fetch/XMLHttpRequest/console the same way rilog-lib does — but it is a standalone,
 * independent implementation: it does not depend on the page having rilog-lib installed.
 * It only has to emit data shaped as `@rilog-development/rilog-shared`'s types (the actual
 * shared contract) via window.postMessage — MAIN-world scripts have no chrome.* API access,
 * so postMessage is the only way to hand events to content/bridge.ts (isolated world).
 */
import {
    ERilogEvent,
    generateUniqueId,
    getLocation,
    IRilogClick,
    IRilogConsoleData,
    IRilogEventItem,
    IRilogInput,
    IRilogRequest,
    IRilogRequestItem,
    IRilogResponse,
    parseStackTrace,
    RilogInputEvent,
} from '@rilog-development/rilog-shared';

declare global {
    interface Window {
        __rilogDevtoolsCaptureInstalled?: boolean;
    }
}

const BRIDGE_SOURCE_CAPTURE = 'rilog-devtools-capture';
const BUTTON_NODES = ['button', 'a'];
const INPUT_NODES = ['input', 'textarea', 'select'];
const SENSITIVE_INPUT_TYPES = ['password'];
const SENSITIVE_AUTOCOMPLETE = ['cc-number', 'cc-csc', 'cc-exp', 'cc-exp-month', 'cc-exp-year', 'current-password', 'new-password'];

function emit(event: IRilogEventItem): void {
    window.postMessage({ source: BRIDGE_SOURCE_CAPTURE, event }, '*');
}

function buildEvent(type: ERilogEvent, data: IRilogEventItem['data']): IRilogEventItem {
    return {
        _id: generateUniqueId(),
        type,
        date: Date.now().toString(),
        data,
        location: getLocation(),
    };
}

function safeParseJson(text: string): unknown {
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

function safeParseBody(body: unknown): unknown {
    if (body == null) return null;
    if (typeof body === 'string') {
        try {
            return JSON.parse(body);
        } catch {
            return body;
        }
    }
    if (body instanceof FormData) {
        const obj: Record<string, unknown> = {};
        body.forEach((value, key) => {
            obj[key] = value instanceof File ? `[File: ${value.name}, ${value.size}b]` : value;
        });
        return obj;
    }
    if (body instanceof Blob) return `[Blob: ${body.size}b, ${body.type}]`;
    if (body instanceof ArrayBuffer) return `[ArrayBuffer: ${body.byteLength}b]`;
    return String(body);
}

function emitRequestItem(request: IRilogRequest, response: IRilogResponse, startedAt: number): void {
    const item: IRilogRequestItem = {
        _id: generateUniqueId(),
        request: { ...request, timestamp: startedAt },
        response: { ...response, timestamp: Date.now() },
        duration: String(Date.now() - startedAt),
    };
    emit({ _id: generateUniqueId(), type: ERilogEvent.REQUEST, date: startedAt.toString(), data: item, location: getLocation() });
}

function resolveFetchUrl(input: RequestInfo | URL): string {
    if (input instanceof Request) return input.url;
    if (input instanceof URL) return input.href;
    return String(input);
}

function patchFetch(): void {
    const originalFetch = window.fetch;

    window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
        const url = resolveFetchUrl(input);
        const method = (input instanceof Request ? input.method : init?.method) || 'GET';
        const headers: Record<string, string> = {};
        const sourceHeaders = input instanceof Request ? input.headers : new Headers(init?.headers);
        sourceHeaders.forEach((value, key) => (headers[key] = value));

        const request: IRilogRequest = {
            url,
            method,
            headers,
            data: safeParseBody(init?.body),
            location: { origin: null, href: null },
            localStorage: null,
        };
        const startedAt = Date.now();

        try {
            const response = await originalFetch.call(window, input, init);
            response
                .clone()
                .text()
                .then((text) => emitRequestItem(request, { status: String(response.status), url: response.url || url, data: safeParseJson(text) }, startedAt))
                .catch(() => emitRequestItem(request, { status: String(response.status), url, data: null }, startedAt));
            return response;
        } catch (err) {
            emitRequestItem(request, { status: 'network_error', url, data: String(err) }, startedAt);
            throw err;
        }
    };
}

function patchXHR(): void {
    const OriginalXHR = window.XMLHttpRequest;

    function XHRProxy(this: XMLHttpRequest) {
        const xhr = new OriginalXHR();
        const headers: Record<string, string> = {};
        let url = '';
        let method = '';
        let startedAt = 0;

        const originalOpen = xhr.open.bind(xhr);
        (xhr as any).open = (m: string, u: string | URL, ...rest: any[]) => {
            method = m;
            url = u instanceof URL ? u.href : String(u);
            return (originalOpen as any)(m, u, ...rest);
        };

        const originalSetRequestHeader = xhr.setRequestHeader.bind(xhr);
        (xhr as any).setRequestHeader = (name: string, value: string) => {
            headers[name] = value;
            return originalSetRequestHeader(name, value);
        };

        const originalSend = xhr.send.bind(xhr);
        (xhr as any).send = (body?: Document | XMLHttpRequestBodyInit | null) => {
            startedAt = Date.now();
            const request: IRilogRequest = { url, method, headers: { ...headers }, data: safeParseBody(body), location: { origin: null, href: null }, localStorage: null };

            xhr.addEventListener('loadend', () => {
                emitRequestItem(request, { status: String(xhr.status), url, data: safeParseJson(xhr.responseText) }, startedAt);
            });

            return originalSend(body);
        };

        return xhr;
    }

    XHRProxy.prototype = OriginalXHR.prototype;
    (window as any).XMLHttpRequest = XHRProxy;
}

function getParentButton(target: HTMLElement | null): HTMLElement | undefined {
    let current = target;
    while (current) {
        if (BUTTON_NODES.includes(current.tagName?.toLowerCase())) return current;
        current = current.parentElement;
    }
    return undefined;
}

function patchClicks(): void {
    document.addEventListener(
        'click',
        (e: MouseEvent) => {
            const target = e.target as HTMLElement | null;
            if (!target) return;
            const el = getParentButton(target) || target;

            const data: IRilogClick = {
                id: el.id,
                inner: el.innerText?.trim().slice(0, 300) || '',
                nodeName: el.nodeName,
                classNames: el.className,
            };
            emit(buildEvent(ERilogEvent.CLICK, data));
        },
        true,
    );
}

function isSensitiveField(input: HTMLInputElement): boolean {
    const type = (input.type || '').toLowerCase();
    const autocomplete = (input.autocomplete || '').toLowerCase();
    return SENSITIVE_INPUT_TYPES.includes(type) || SENSITIVE_AUTOCOMPLETE.some((a) => autocomplete.includes(a));
}

function patchInputs(): void {
    document.addEventListener(
        'focusout',
        (e: FocusEvent) => {
            const target = e.target as HTMLInputElement | null;
            if (!target?.tagName || !INPUT_NODES.includes(target.tagName.toLowerCase())) return;

            const data: IRilogInput = {
                type: RilogInputEvent.BLUR,
                value: isSensitiveField(target) ? '*' : target.value,
                nodeName: target.nodeName,
                className: target.className,
                id: target.id,
                name: target.name || '',
                inputType: target.type || 'text',
            };
            emit(buildEvent(ERilogEvent.INPUT, data));
        },
        true,
    );
}

function serializeArg(arg: unknown): string {
    if (typeof arg === 'string') return arg;
    if (arg instanceof Error) return `${arg.message}\n${arg.stack ?? ''}`.trim();
    try {
        return JSON.stringify(arg);
    } catch {
        return String(arg);
    }
}

function patchConsole(): void {
    const originalWarn = console.warn.bind(console);
    const originalError = console.error.bind(console);
    const originalOnError = window.onerror;

    console.warn = (...args: unknown[]) => {
        originalWarn(...args);
        const data: IRilogConsoleData = { level: 'warn', message: args.map(serializeArg).join(' '), source: 'console', stackTrace: parseStackTrace(new Error().stack || '') };
        emit(buildEvent(ERilogEvent.CONSOLE_WARN, data));
    };

    console.error = (...args: unknown[]) => {
        originalError(...args);
        const data: IRilogConsoleData = { level: 'error', message: args.map(serializeArg).join(' '), source: 'console', stackTrace: parseStackTrace(new Error().stack || '') };
        emit(buildEvent(ERilogEvent.CONSOLE_ERROR, data));
    };

    window.onerror = (message, source, lineno, colno, error) => {
        const msg = typeof message === 'string' ? message : String(message);
        const stackTrace = error?.stack ? parseStackTrace(error.stack) : undefined;
        const data: IRilogConsoleData = { level: 'error', message: msg, source: 'runtime', errorFile: source ?? undefined, errorLine: lineno ?? undefined, errorColumn: colno ?? undefined, stackTrace };
        emit(buildEvent(ERilogEvent.CONSOLE_ERROR, data));

        if (typeof originalOnError === 'function') originalOnError(message, source, lineno, colno, error);
        return false;
    };

    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
        const reason = event.reason;
        const message = reason instanceof Error ? reason.message : `Unhandled rejection: ${String(reason)}`;
        const stackTrace = reason instanceof Error && reason.stack ? parseStackTrace(reason.stack) : undefined;
        const data: IRilogConsoleData = { level: 'error', message, source: 'unhandledRejection', stackTrace };
        emit(buildEvent(ERilogEvent.CONSOLE_ERROR, data));
    });
}

function install(): void {
    if (window.__rilogDevtoolsCaptureInstalled) return;
    window.__rilogDevtoolsCaptureInstalled = true;

    patchFetch();
    patchXHR();
    patchClicks();
    patchInputs();
    patchConsole();
}

install();
