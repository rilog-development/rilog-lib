import * as CryptoJS from 'crypto-js';
import { IRilogRequestItem, TRilogState } from '../types';

/**
 * Encryt request data for save request array
 * @param data
 */
const encrypt = (data: IRilogRequestItem[], salt: TRilogState['salt']): string => {
    return CryptoJS.AES.encrypt(JSON.stringify(data), salt || '').toString();
};

export { encrypt };
