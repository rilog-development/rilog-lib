import { BUTTON_NODES } from './constants';

const isButtonElement = (event: any) => {
    let current: HTMLElement | null = event.target as HTMLElement;

    while (current) {
        if (BUTTON_NODES.includes(current.tagName.toLowerCase())) return true;
        current = current.parentElement;
    }

    return false;
};

export { isButtonElement };
