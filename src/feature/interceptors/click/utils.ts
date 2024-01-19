import { BUTTON_NODES } from './constants';

const isButtonElement = (event: any) => {
    console.log('isButtonElement ', event.target.tagName);
    if (BUTTON_NODES.includes(event.target.tagName.toLowerCase())) return true;

    /**
     * Check if closest parent element is button (for case where some html inside a, button tags).
     */
    if (event.target.parentElement && BUTTON_NODES.includes(event.target.parentElement.tagName.toLowerCase())) return true;

    return false;
};

export { isButtonElement };
