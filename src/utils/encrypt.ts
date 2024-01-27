import * as CryptoJS from 'crypto-js';
import { TRilogState } from '../types';
import { IRilogEventItem } from '../types/events';

/**
 * Encryt request data for save request array.
 * Encrypt to base64 if the salt doesn't exist.
 * @param data
 */
const encrypt = (data: IRilogEventItem[], salt: TRilogState['salt']): string => {
    return salt?.length ? CryptoJS.AES.encrypt(JSON.stringify(data), salt).toString() : btoa(JSON.stringify(data));
};

export { encrypt };
