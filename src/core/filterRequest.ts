import { SELF_SENSETIVE_REQUEST } from '../constants';
import { IRilogRequestTimed, TRilogInitConfig } from '../types';
import { IRilogFilterRequest } from '../types/filterRequest';

class RilogFilterRequest implements IRilogFilterRequest {
    private config: TRilogInitConfig | null;

    constructor(config: TRilogInitConfig | null) {
        this.config = config;
    }

    getRequests(data: IRilogRequestTimed): IRilogRequestTimed {
        console.log("[RilogFilterRequest] (getRequests) data ", data);
        
        let filteredRequest: IRilogRequestTimed | null = null;

        filteredRequest = this.sensetive(data);
        filteredRequest = this.sensetiveData(filteredRequest);
        filteredRequest = this.headers(filteredRequest);
        filteredRequest = this.storage(filteredRequest);

        console.log("[RilogFilterRequest] (getRequests) filteredRequest ", filteredRequest);

        return filteredRequest;
    }

    isLibruaryRequest(data: IRilogRequestTimed) {
        return SELF_SENSETIVE_REQUEST.some((url) => data.url.includes(url));
    }

    private sensetive(data: IRilogRequestTimed) {
        return this.config?.sensetiveRequsts?.includes(data.url) ? { ...data, headers: 'sensetive', data: 'sensetive' } : data;
    }

    private sensetiveData(data: IRilogRequestTimed) {
        return this.config?.sensetiveDataRequests?.includes(data.url) ? { ...data, data: 'sensetive' } : data;
    }

    private headers(data: IRilogRequestTimed) {
        let headers = {};

        if (data.headers === 'sensetive') {
            return data;
        }

        this.config?.headers?.map((header: string) => {
            headers = { ...headers, [header]: data.headers[header] };
        });

        return { ...data, headers: this.config?.headers ? headers : data.headers };
    }

    private storage(data: IRilogRequestTimed) {
        const localStorageConfig: string[] | null = this.config?.localStorage || null;

        if (localStorageConfig) {
            let resultLocalStorage: {} | null = null;

            const localStorageData = data.localStorage ? JSON.parse(data.localStorage) : null;

            if (!localStorageData) {
                return { ...data, localStorage: '' };
            }

            localStorageConfig.forEach((item) => {
                if (localStorageData[item]) {
                    if (resultLocalStorage) {
                        resultLocalStorage = { ...resultLocalStorage, [item]: localStorageData[item] };
                    } else {
                        resultLocalStorage = { [item]: localStorageData[item] };
                    }
                }
            });

            return { ...data, localStorage: resultLocalStorage || '' };
        } else {
            return { ...data, localStorage: '' };
        }
    }
}

export default RilogFilterRequest;
