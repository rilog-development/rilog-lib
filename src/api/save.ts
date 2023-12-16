import { BASE_URL } from '../constants';

type TSaveEventsResp = {
    result: 'SUCCESS' | 'ERROR';
};

/**
 * Do save events to backend
 * @param data - encrypted events data(array)
 * @returns
 */

const saveEvents = (data: string, token: string): Promise<TSaveEventsResp> => {
    return fetch(`${BASE_URL}/connection/send`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestData: data }),
    })
        .then((response) => response.json())
        .catch((error) => {
            console.error('[Rilog-lib] Got error in connection send request ', error);
        });
};

export { saveEvents };
