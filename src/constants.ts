export { BASE_URL, LOCAL_BASE_URL, TOKEN_GENERATION_SALT, TOKEN_GENERATION_TIMESTAMP } from './secrets';

export const RIL_TOKEN = 'riltoken'; // label for saving unique user (connection) token in Local Storage
export const RIL_EVENTS = 'rilevents'; // label for saving reuqests in Local Storage
export const EVENTS_ARRAY_LIMIT = 10; // max availble events data for saving in localStorage
export const LONG_TIMER_LIMIT = 12000; // use it for check saving request data (without request during long time)
export const SUCCESS_RESPONSE_STATUS_START_CODE = '2';
export const SELF_SENSETIVE_REQUEST = ['connection/init', 'connection/send', 'events/save']; // the array of requests which shouldn't be stored

export const SELF_SENSETIVE_CLICK_IDS = ['rilog-lib'];
export const MAX_LOCAL_STORAGE_SIZE = 4.5; // max available size of local storage in Mb. Using for defining when the events send to the backend storage.

export const MAX_EVENTS_SIZE_MB = 2; // max available size of events in Mb. Using for defining when the events send to the backend storage.
export const RIL_VERSION = '0.4.1'; // current rilog lib version
