import * as CryptoJS from 'crypto-js';
import { TRilogState } from '../types';
import { IRilogEventItem } from '../types/events';

/**
 * Encryt request data for save request array
 * @param data
 */
const encrypt = (data: IRilogEventItem[], salt: TRilogState['salt']): string => {
    return CryptoJS.AES.encrypt(JSON.stringify(data), salt || '').toString();
};

export { encrypt };
