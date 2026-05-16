import { TDeviceInfo, TExternalInfoMeta } from '../types/core';
import { IRilogLocation } from '../types/events';

const getExternalInfo = (meta?: TExternalInfoMeta) => {
    return {
        userAgent: navigator.userAgent,
        ...(meta ? { meta } : {}),
    };
};

const getLocation = (): IRilogLocation => {
    return {
        origin: window.location?.origin || null,
        href: window.location?.href || null,
    };
};

const resolveDeviceType = (ua: string, screenW: number): TDeviceInfo['deviceType'] => {
    if (/Mobi|Android|iPhone|iPod/i.test(ua)) return 'mobile';
    if (/Tablet|iPad/i.test(ua) || (screenW >= 600 && screenW < 1024)) return 'tablet';
    return 'desktop';
};

const getDeviceInfo = (): TDeviceInfo => {
    const ua = navigator.userAgent;
    const connection = (navigator as any).connection ?? (navigator as any).mozConnection ?? (navigator as any).webkitConnection;
    return {
        userAgent: ua,
        screenWidth: screen.width,
        screenHeight: screen.height,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio ?? 1,
        colorDepth: screen.colorDepth,
        language: navigator.language,
        hardwareConcurrency: navigator.hardwareConcurrency ?? null,
        deviceType: resolveDeviceType(ua, screen.width),
        connectionType: connection?.effectiveType ?? null,
    };
};

export { getExternalInfo, getLocation, getDeviceInfo };
