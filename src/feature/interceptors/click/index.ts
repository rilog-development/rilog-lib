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

        const targetElement = this.getParentButton(event.target as HTMLElement) || (event.target as HTMLElement);

        const elementInfo: IRilogClick = {
            inner: targetElement.innerText?.trim() || '',
            nodeName: targetElement.nodeName,
            classNames: targetElement.className,
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
     * Traverse up the DOM tree to find the nearest button/link ancestor.
     * Handles cases where the click target is a deeply nested element (e.g. svg > path inside a button).
     * @param target
     * @returns
     */
    private getParentButton(target: HTMLElement): HTMLElement | undefined {
        let current: HTMLElement | null = target;

        while (current) {
            if (BUTTON_NODES.includes(current.tagName.toLowerCase())) return current;
            current = current.parentElement;
        }

        return undefined;
    }
}

export default ClickInterceptor;
