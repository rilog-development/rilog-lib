import { TExternalInfoMeta } from '../types/core';
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

export { getExternalInfo, getLocation };
