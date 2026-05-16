export { BASE_URL, LOCAL_BASE_URL, TOKEN_GENERATION_SALT, TOKEN_GENERATION_TIMESTAMP } from './secrets';
export const DEFAULT_LOCAL_URL = 'http://localhost:3030';

export const RIL_TOKEN = 'riltoken';
export const RIL_EVENTS = 'rilevents';
export const EVENTS_ARRAY_LIMIT = 10;
export const LONG_TIMER_LIMIT = 12000;
export const REQUEST_TIMEOUT_LIMIT = 300000;
export const SUCCESS_RESPONSE_STATUS_START_CODE = '2';
export const SELF_SENSETIVE_REQUEST = ['connection/init', 'connection/send', 'events/save'];
export const SELF_SENSETIVE_CLICK_IDS = ['rilog-lib'];
export const RIL_VERSION = '0.4.1';
