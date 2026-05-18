/**
 * @jest-environment jsdom
 */
import MessageInterceptor from '../feature/interceptors/message';
import { ERilogEvent } from '../types/events';

describe('MessageInterceptor', () => {
    const interceptor = new MessageInterceptor();

    describe('getMessageEvent', () => {
        it('returns an event with DEBUG_MESSAGE type', () => {
            const event = interceptor.getMessageEvent('hello', { label: 'test' });
            expect(event.type).toBe(ERilogEvent.DEBUG_MESSAGE);
        });

        it('keeps string data as-is and sets shouldBeParsed to false', () => {
            const event = interceptor.getMessageEvent('plain string', { label: '' });
            expect(event.data.data).toBe('plain string');
            expect(event.data.shouldBeParsed).toBe(false);
        });

        it('JSON-stringifies non-string data and sets shouldBeParsed to true', () => {
            const event = interceptor.getMessageEvent({ key: 'val' }, { label: '' });
            expect(event.data.data).toBe('{"key":"val"}');
            expect(event.data.shouldBeParsed).toBe(true);
        });

        it('uses the label from config', () => {
            const event = interceptor.getMessageEvent('msg', { label: 'my-label' });
            expect(event.data.label).toBe('my-label');
        });

        it('defaults label to empty string when config has no label', () => {
            const event = interceptor.getMessageEvent('msg', { label: '' });
            expect(event.data.label).toBe('');
        });

        it('attaches the provided stackTrace', () => {
            const event = interceptor.getMessageEvent('msg', { label: '' }, 'at foo (app.js:10)');
            expect(event.data.stackTrace).toBe('at foo (app.js:10)');
        });

        it('stackTrace is undefined when not provided', () => {
            const event = interceptor.getMessageEvent('msg', { label: '' });
            expect(event.data.stackTrace).toBeUndefined();
        });

        it('includes _id, date, and location fields', () => {
            const event = interceptor.getMessageEvent('msg', { label: '' });
            expect(typeof event._id).toBe('string');
            expect(typeof event.date).toBe('string');
            expect(event.location).toHaveProperty('origin');
            expect(event.location).toHaveProperty('href');
        });

        it('generates unique _id on each call', () => {
            const ids = new Set(Array.from({ length: 50 }, () => interceptor.getMessageEvent('x', { label: '' })._id));
            expect(ids.size).toBe(50);
        });

        it('handles number data', () => {
            const event = interceptor.getMessageEvent(42, { label: '' });
            expect(event.data.data).toBe('42');
            expect(event.data.shouldBeParsed).toBe(true);
        });

        it('handles null data', () => {
            const event = interceptor.getMessageEvent(null, { label: '' });
            expect(event.data.data).toBe('null');
            expect(event.data.shouldBeParsed).toBe(true);
        });
    });
});
