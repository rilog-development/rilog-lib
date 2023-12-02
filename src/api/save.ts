import { BASE_URL } from '../constants';

type TSaveRequestResp = {
    result: 'SUCCESS' | 'ERROR';
};

/**
 * Do save request to back
 * @param data - encrypted requests data(array)
 * @returns
 */

const saveRequest = (data: string, token: string): Promise<TSaveRequestResp> => {
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

export { saveRequest };
