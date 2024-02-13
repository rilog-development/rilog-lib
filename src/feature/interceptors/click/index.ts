import { ERilogEvent, IRilogEventItem } from '../../../types/events';
import { generateUniqueId, getLocation } from '../../../utils';
import { logMethods } from '../../../utils/logger';
import { BUTTON_NODES } from './constants';
import { IRilogClick, IRilogClickInterceptor } from './types';
import { SELF_SENSETIVE_CLICK_IDS } from '../../../constants';

class ClickInterceptor implements IRilogClickInterceptor {
    @logMethods('ClickInterceptor', true)
    public getClickEvent(event: any): IRilogEventItem | undefined {
        const id = this.getParentButton(event.target as HTMLElement)?.id || event.target.id;

        if (id && SELF_SENSETIVE_CLICK_IDS.some((selfId) => id.includes(selfId))) return;

        const elementInfo: IRilogClick = {
            inner: this.getParentButton(event.target as HTMLElement)?.innerHTML || event.target.innerHTML,
            nodeName: this.getParentButton(event.target as HTMLElement)?.nodeName || event.target.nodeName,
            classNames: this.getParentButton(event.target as HTMLElement)?.className || event.target.className,
            id,
        };

        return {
            _id: generateUniqueId(),
            type: ERilogEvent.CLICK,
            date: Date.now().toString(),
            data: elementInfo,
            location: getLocation(),
        };
    }

    /**
     * Return HTMLElement if parent is button element. In case when click was on inner element (not button).
     * @param target
     * @returns
     */
    private getParentButton(target: HTMLElement) {
        if (BUTTON_NODES.includes(target.tagName.toLowerCase())) return target;

        if (!target.parentElement || !BUTTON_NODES.includes(target.parentElement.tagName.toLowerCase())) return;

        return target.parentElement;
    }
}

export default ClickInterceptor;
