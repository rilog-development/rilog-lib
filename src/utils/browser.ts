import { MAX_LOCAL_STORAGE_SIZE } from '../constants';
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

/**
 * Get Local Storage size in bytes.
 * @returns {number}
 */
const getLocalStorageSize = () => {
    var totalSize = 0;

    // Iterate through all items in local storage
    for (var i = 0; i < localStorage.length; i++) {
        const key: string = localStorage.key(i) || '';
        const value: string = localStorage.getItem(key) || '';

        // Calculate the size of key and value in bytes
        var keySize = key.length * 2; // Each character is 2 bytes in JavaScript
        var valueSize = value.length * 2 || 1; // Minimum size is 1 byte

        // Add the key and value sizes to the total size
        totalSize += keySize + valueSize;
    }

    // Return the total size in bytes
    return totalSize;
};

/**
 * Simple converter function from megabytes to bytes for defining the max available size of local storage.
 * @param {number} megabytes
 * @returns {number} In bytes
 */
const megabytesToBytes = (megabytes: number): number => {
    const bytesInMegabyte = 1024 * 1024;
    return megabytes * bytesInMegabyte;
};

const isFullLocalStorage = (additionalData: string | null) => {
    if (!additionalData) return false;
    const localStorageSize = getLocalStorageSize();
    const additionalDataSize = additionalData.length * 2; // Each character is 2 bytes in JavaScript.

    const maxLocalStorageSize = megabytesToBytes(MAX_LOCAL_STORAGE_SIZE);

    if (localStorageSize + additionalDataSize > maxLocalStorageSize) return true;

    return false;
};

export { getExternalInfo, getLocation, getLocalStorageSize, megabytesToBytes, isFullLocalStorage };
