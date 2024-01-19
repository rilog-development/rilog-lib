import { ERilogEvent } from '../../../types/events';
import { getLocation } from '../../../utils';
import { IRilogMessageConfig, IRilogMessageData, IRilogMessageInterceptor } from './types';

class MessageInterceptor implements IRilogMessageInterceptor {
    public getMessageEvent<T>(data: T, config: IRilogMessageConfig | undefined) {
        const parsedData: string = typeof data === 'string' ? data : JSON.stringify(data);

        return {
            _id: Date.now().toString(),
            type: ERilogEvent.DEBUG_MESSAGE,
            date: Date.now().toString(),
            data: {
                data: parsedData,
                label: config?.label ?? '',
                shouldBeParsed: typeof data !== 'string',
            },
            location: getLocation(),
        };
    }
}

export default MessageInterceptor;
