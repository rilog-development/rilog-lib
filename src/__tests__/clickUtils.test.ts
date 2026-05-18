/**
 * @jest-environment jsdom
 */
import { isButtonElement } from '../feature/interceptors/click/utils';

const makeEvent = (tagName: string, parent?: HTMLElement): Event => {
    const el = document.createElement(tagName);
    if (parent) parent.appendChild(el);
    return { target: el } as unknown as Event;
};

describe('isButtonElement', () => {
    it('returns true when target is a <button>', () => {
        expect(isButtonElement(makeEvent('button'))).toBe(true);
    });

    it('returns true when target is an <a> anchor', () => {
        expect(isButtonElement(makeEvent('a'))).toBe(true);
    });

    it('returns false when target is a <div>', () => {
        expect(isButtonElement(makeEvent('div'))).toBe(false);
    });

    it('returns false when target is an <input>', () => {
        expect(isButtonElement(makeEvent('input'))).toBe(false);
    });

    it('returns true when target is a child element inside a <button>', () => {
        const button = document.createElement('button');
        const span = document.createElement('span');
        button.appendChild(span);
        const event = { target: span } as unknown as Event;
        expect(isButtonElement(event)).toBe(true);
    });

    it('returns true when target is deeply nested inside an <a>', () => {
        const anchor = document.createElement('a');
        const div = document.createElement('div');
        const span = document.createElement('span');
        div.appendChild(span);
        anchor.appendChild(div);
        const event = { target: span } as unknown as Event;
        expect(isButtonElement(event)).toBe(true);
    });

    it('returns false when target is nested inside a plain <div>', () => {
        const wrapper = document.createElement('div');
        const span = document.createElement('span');
        wrapper.appendChild(span);
        const event = { target: span } as unknown as Event;
        expect(isButtonElement(event)).toBe(false);
    });
});
