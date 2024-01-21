import { BASE_URL } from '../constants';
import { TInitRequest, TInitResponse, TRilogInitConfig } from '../types';

interface InitRequestParams {
    data: TInitRequest;
    config: TRilogInitConfig | undefined;
}

const initRequest = async ({ data, config }: InitRequestParams): Promise<TInitResponse> => {
    /**
     * Do not make an init request if enabled local saving events or self saving.
     */

    if (config?.localSaving || config?.selfSaving)
        return Promise.resolve({
            access_token: '',
            salt: '',
            recording: true,
        });

    /**
     * Generate Authorization header ('Basic '), includes:
     * { token, key, salt }
     */

    return fetch(`${BASE_URL}/connection/init`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
        .then((response) => response.json())
        .catch((error) => {
            console.error('[Rilog-lib] Got error in connection init request', error);
        });
};

export { initRequest };
