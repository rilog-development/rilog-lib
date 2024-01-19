import { SELF_SENSETIVE_REQUEST } from '../constants';

const isLibruarySensetiveRequest = (url: string) => SELF_SENSETIVE_REQUEST.some((sensetiveUrl) => url.includes(sensetiveUrl));

const isUrlIgnored = (url: string, ignoredRequests: string[]) => ignoredRequests.some((ignoredUrl) => url.toLowerCase().includes(ignoredUrl.toLowerCase()));

export { isLibruarySensetiveRequest, isUrlIgnored };
