import { ERilogEvent } from '../../../types/events';
import { getLocation } from '../../../utils';
import { logMethods } from '../../../utils/logger';
import { IRilogInput, IRilogInputInterceptor, RilogInputEvent } from './types';

class InputInterceptor implements IRilogInputInterceptor {
    @logMethods('InputInterceptor', true)
    public getInputEvent(event: any, type: RilogInputEvent) {
        const inputInfo: IRilogInput = {
            type,
            value: event.target.value,
            nodeName: event.target.nodeName,
            className: event.target.className,
            id: event.target.id,
        };

        return {
            _id: Date.now().toString(),
            type: ERilogEvent.INPUT,
            date: Date.now().toString(),
            data: inputInfo,
            location: getLocation(),
        };
    }
}

export default InputInterceptor;
