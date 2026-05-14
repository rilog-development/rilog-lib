import { ERilogEvent, IRilogEventItem } from '../../../types/events';
import { generateUniqueId, getLocation } from '../../../utils';
import { IRilogInput, IRilogInputInterceptor, RilogInputEvent } from './types';

const INPUT_NODES = ['input', 'textarea', 'select'];

const SENSITIVE_INPUT_TYPES = ['password'];

const SENSITIVE_AUTOCOMPLETE = ['cc-number', 'cc-csc', 'cc-exp', 'cc-exp-month', 'cc-exp-year', 'current-password', 'new-password'];

class InputInterceptor implements IRilogInputInterceptor {
    private onFocusOut: ((event: FocusEvent) => void) | null = null;
    private isStarted = false;

    start(onEvent: (event: IRilogEventItem) => void): void {
        if (this.isStarted) return;
        this.isStarted = true;

        this.onFocusOut = (event: FocusEvent) => {
            const target = event.target as HTMLInputElement;

            if (!this.isInputElement(target)) return;

            const inputEvent = this.buildInputEvent(target, RilogInputEvent.BLUR);
            if (inputEvent) onEvent(inputEvent);
        };

        // capture phase — works with React synthetic events and plain DOM
        document.addEventListener('focusout', this.onFocusOut, true);
    }

    stop(): void {
        if (this.onFocusOut) {
            document.removeEventListener('focusout', this.onFocusOut, true);
            this.onFocusOut = null;
        }
        this.isStarted = false;
    }

    private buildInputEvent(target: HTMLInputElement, type: RilogInputEvent): IRilogEventItem {
        const inputInfo: IRilogInput = {
            type,
            value: this.isSensitiveField(target) ? '*' : target.value,
            nodeName: target.nodeName,
            className: target.className,
            id: target.id,
            name: target.name || '',
            inputType: target.type || 'text',
        };

        return {
            _id: generateUniqueId(),
            type: ERilogEvent.INPUT,
            date: Date.now().toString(),
            data: inputInfo,
            location: getLocation(),
        };
    }

    private isInputElement(target: HTMLElement): boolean {
        return INPUT_NODES.includes(target.tagName?.toLowerCase());
    }

    private isSensitiveField(input: HTMLInputElement): boolean {
        const type = (input.type || '').toLowerCase();
        const autocomplete = (input.autocomplete || '').toLowerCase();
        return SENSITIVE_INPUT_TYPES.includes(type) || SENSITIVE_AUTOCOMPLETE.some((a) => autocomplete.includes(a));
    }
}

export default InputInterceptor;
