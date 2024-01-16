import { IRilogLocation } from '../types/events';

const getExternalInfo = () => {
    return {
        userAgent: navigator.userAgent,
    };
};

const getLocation = (): IRilogLocation => {
    return {
        origin: window.location?.origin || null,
        href: window.location?.href || null,
    };
};

export { getExternalInfo, getLocation };
