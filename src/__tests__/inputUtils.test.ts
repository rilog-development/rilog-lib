/**
 * @jest-environment jsdom
 */
import { isInputElement } from '../feature/interceptors/input/utils';

const makeEvent = (tagName: string): Event => {
    const el = document.createElement(tagName);
    return { target: el } as unknown as Event;
};

describe('isInputElement', () => {
    it('returns true when target is an <input>', () => {
        expect(isInputElement(makeEvent('input'))).toBe(true);
    });

    it('returns false when target is a <button>', () => {
        expect(isInputElement(makeEvent('button'))).toBe(false);
    });

    it('returns false when target is a <div>', () => {
        expect(isInputElement(makeEvent('div'))).toBe(false);
    });

    it('returns false when target is a <textarea>', () => {
        expect(isInputElement(makeEvent('textarea'))).toBe(false);
    });

    it('returns false when target is a <select>', () => {
        expect(isInputElement(makeEvent('select'))).toBe(false);
    });
});
