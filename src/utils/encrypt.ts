import { getState } from '../state';
import { IRilogRequestItem } from '../types';
import * as CryptoJS from 'crypto-js';

/**
 * Encryt request data for save request array
 * @param data
 */
const encrypt = (data: IRilogRequestItem[]): string => {
    const state = getState();

    return CryptoJS.AES.encrypt(JSON.stringify(data), state.salt || '').toString();
};

export { encrypt };
