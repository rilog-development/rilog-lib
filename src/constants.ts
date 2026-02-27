export const BASE_URL = process.env.RILOG_BASE_URL || 'http://localhost:3000';
export const LOCAL_BASE_URL = process.env.RILOG_LOCAL_BASE_URL || 'http://localhost:3025';
export const RIL_TOKEN = process.env.RILOG_RIL_TOKEN || 'riltoken';
export const RIL_EVENTS = process.env.RILOG_RIL_EVENTS || 'rilevents';
export const EVENTS_ARRAY_LIMIT = Number(process.env.RILOG_EVENTS_ARRAY_LIMIT);
export const LONG_TIMER_LIMIT = Number(process.env.RILOG_LONG_TIMER_LIMIT);
export const SUCCESS_RESPONSE_STATUS_START_CODE = process.env.RILOG_SUCCESS_RESPONSE_STATUS_START_CODE;
export const TOKEN_GENERATION_SALT = process.env.RILOG_TOKEN_GENERATION_SALT;
export const TOKEN_GENERATION_TIMESTAMP = process.env.RILOG_TOKEN_GENERATION_TIMESTAMP;
export const SELF_SENSETIVE_REQUEST = process.env.RILOG_SELF_SENSETIVE_REQUEST?.split(',');

export const SELF_SENSETIVE_CLICK_IDS = process.env.RILOG_SELF_SENSETIVE_CLICK_IDS?.split(',');
export const MAX_LOCAL_STORAGE_SIZE = Number(process.env.RILOG_MAX_LOCAL_STORAGE_SIZE) || 4.5;

export const MAX_EVENTS_SIZE_MB = Number(process.env.RILOG_MAX_EVENTS_SIZE_MB) || 2;
export const RIL_VERSION = process.env.RILOG_VERSION || '0.3.*';
