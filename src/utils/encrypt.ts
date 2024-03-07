import * as CryptoJS from 'crypto-js';
import { TRilogState } from '../types';
import { IRilogEventItem } from '../types/events';

/**
 * Encrypt request data for save request array.
 * Encrypt to string (using JSON.stringify) if the salt doesn't exist.
 * @param data
 */
const encrypt = (data: IRilogEventItem[], salt: TRilogState['salt']): string => {
    return salt?.length ? CryptoJS.AES.encrypt(JSON.stringify(data), salt).toString() : JSON.stringify(data);
};

export { encrypt };
