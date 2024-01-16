import { ERilogEvent, IRilogEventItem } from '../../../types/events';
import { getLocation } from '../../../utils';
import { logMethods } from '../../../utils/logger';
import { BUTTON_NODES } from './constants';
import { IRilogClick, IRilogClickInterceptor } from './types';

class ClickInterceptor implements IRilogClickInterceptor {

    @logMethods('ClickInterceptor', true)
    public getClickEvent(event: any): IRilogEventItem {
        const elementInfo: IRilogClick = {
            inner: this.getParentButton(event.target as HTMLElement)?.innerHTML || event.target.innerHTML,
            nodeName: this.getParentButton(event.target as HTMLElement)?.nodeName || event.target.nodeName,
            classNames: this.getParentButton(event.target as HTMLElement)?.className || event.target.className,
            id: this.getParentButton(event.target as HTMLElement)?.id || event.target.id,
        };

        return {
            _id: Date.now().toString(),
            type: ERilogEvent.CLICK,
            date: Date.now().toString(),
            data: elementInfo,
            location: getLocation()
        };
    }

    /**
     * Return HTMLElement if parent is button element. In case when click was on inner element (not button).
     * @param target
     * @returns
     */
    private getParentButton(target: HTMLElement) {
        if (BUTTON_NODES.includes(target.nodeName.toLowerCase())) return target;

        if (!target.parentElement || !BUTTON_NODES.includes(target.parentElement.nodeName.toLowerCase())) return;

        return target.parentElement;
    }
}

export default ClickInterceptor;
