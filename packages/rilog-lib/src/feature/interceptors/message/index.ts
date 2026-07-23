import { ERilogEvent, generateUniqueId, getLocation, IRilogMessageConfig, IRilogMessageData } from '@rilog-development/rilog-shared';
import { IRilogMessageInterceptor } from './types';

class MessageInterceptor implements IRilogMessageInterceptor {
    public getMessageEvent<T>(data: T, config: IRilogMessageConfig | undefined, stackTrace?: string) {
        const parsedData: string = typeof data === 'string' ? data : JSON.stringify(data);

        return {
            _id: generateUniqueId(),
            type: ERilogEvent.DEBUG_MESSAGE,
            date: Date.now().toString(),
            data: {
                data: parsedData,
                label: config?.label ?? '',
                shouldBeParsed: typeof data !== 'string',
                stackTrace,
            },
            location: getLocation(),
        };
    }
}

export default MessageInterceptor;
