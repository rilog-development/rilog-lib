import { BASE_URL } from '../constants';

type TSaveEventsResp = {
    result: 'SUCCESS' | 'ERROR';
};

/**
 * Do save events to backend
 * @param data - encrypted events data(array)
 * @param token - authorization token for sending requests
 * @returns
 */

const saveEventsToRilog = (data: string, token: string): Promise<TSaveEventsResp> => {
    return fetch(`${BASE_URL}/connection/send`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ eventsData: data }),
    })
        .then((response) => response.json())
        .catch((error) => {
            console.error('[Rilog-lib] Got error in save events to rilog (/connection/send) ', error);
        });
};

interface ISaveEventsParams {
    data: string;
    url: string;
    headers?: Record<string, string>;
}

const saveEventsCustom = ({ data, url, headers }: ISaveEventsParams): Promise<TSaveEventsResp> => {
    const updatedHeaders = new Headers();

    updatedHeaders.append('Content-Type', 'application/json');

    if (headers) {
        Object.keys(headers).forEach((key) => {
            updatedHeaders.append(key, headers[key]);
        });
    }

    return fetch(url, {
        method: 'POST',
        headers: updatedHeaders,
        body: data,
    })
        .then((response) => response.json())
        .catch((error) => {
            console.error('[Rilog-lib] Got error in save events ', error);
        });
};

export { saveEventsToRilog, saveEventsCustom };
