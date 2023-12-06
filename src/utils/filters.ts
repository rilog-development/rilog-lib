import { SELF_SENSETIVE_REQUEST } from '../constants';

const isLibruarySensetiveRequest = (url: string) => SELF_SENSETIVE_REQUEST.some((sensetiveUrl) => url.includes(sensetiveUrl));

export { isLibruarySensetiveRequest };
