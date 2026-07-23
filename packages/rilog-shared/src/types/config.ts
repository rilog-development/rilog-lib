/**
 * Capture-layer config: what to capture, mask, or disable.
 * Consumed by RilogFilterRequest and the interceptors, and by any other
 * consumer (e.g. the Chrome extension) that wants the same masking rules.
 */
export type TRilogCaptureConfig = Partial<{
    ignoredRequests: string[]; // ignore this requests (do not save this)
    sensetiveRequsts: string[]; // this request will not be written,
    sensetiveDataRequests: string[]; // will not be written data to requests (example: card data),
    headers: string[]; // write only this headers,
    localStorage: string[]; // only this params will be stored
    disableFetchInterceptor: boolean; // disable fetch interception
    disableXHRInterceptor: boolean; // disable XMLHttpRequest interception
    disableClickInterceptor: boolean; // disable click on button/links interception
    disableConsoleInterceptor: boolean; // disable console.warn/console.error interception
    disableInputInterceptor: boolean; // disable input focusout interception
}>;

export interface ISelfServer {
    url: string; // full URL of the POST endpoint on your backend (any path you define)
    headers?: Record<string, string>;
}

export type TExternalInfoMeta = {
    environment?: string;
    branch?: string;
    framework?: string;
    platform?: string;
};

export type TDeviceInfo = {
    userAgent: string;
    screenWidth: number;
    screenHeight: number;
    viewportWidth: number;
    viewportHeight: number;
    devicePixelRatio: number;
    colorDepth: number;
    language: string;
    hardwareConcurrency: number | null;
    deviceType: 'mobile' | 'tablet' | 'desktop';
    connectionType: string | null;
};
