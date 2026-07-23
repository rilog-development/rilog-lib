import QueueArray from '../utils/queque';

interface Item {
    id: string;
    timestamp: number;
    value: string;
}

const makeItem = (id: string, timestamp = 0, value = 'v'): Item => ({ id, timestamp, value });

describe('QueueArray', () => {
    describe('enqueue / size / isEmpty', () => {
        it('starts empty', () => {
            const q = new QueueArray<Item>();
            expect(q.isEmpty()).toBe(true);
            expect(q.size()).toBe(0);
        });

        it('reflects size after enqueue', () => {
            const q = new QueueArray<Item>();
            q.enqueue(makeItem('a'));
            q.enqueue(makeItem('b'));
            expect(q.size()).toBe(2);
            expect(q.isEmpty()).toBe(false);
        });
    });

    describe('peek', () => {
        it('returns undefined on empty queue', () => {
            expect(new QueueArray<Item>().peek()).toBeUndefined();
        });

        it('returns first item without removing it', () => {
            const q = new QueueArray<Item>();
            q.enqueue(makeItem('a'));
            q.enqueue(makeItem('b'));
            expect(q.peek()?.id).toBe('a');
            expect(q.size()).toBe(2);
        });
    });

    describe('dequeue', () => {
        it('returns undefined on empty queue', () => {
            const q = new QueueArray<Item>();
            expect(q.dequeue('id', 'x')).toBeUndefined();
        });

        it('returns undefined when key not found', () => {
            const q = new QueueArray<Item>();
            q.enqueue(makeItem('a'));
            expect(q.dequeue('id', 'missing')).toBeUndefined();
            expect(q.size()).toBe(1);
        });

        it('removes and returns matched item', () => {
            const q = new QueueArray<Item>();
            q.enqueue(makeItem('a'));
            q.enqueue(makeItem('b'));
            const result = q.dequeue('id', 'a');
            expect(result?.id).toBe('a');
            expect(q.size()).toBe(1);
            expect(q.peek()?.id).toBe('b');
        });

        it('only removes the first match when duplicates exist', () => {
            const q = new QueueArray<Item>();
            q.enqueue(makeItem('dup'));
            q.enqueue(makeItem('dup'));
            q.dequeue('id', 'dup');
            expect(q.size()).toBe(1);
        });
    });

    describe('dequeueItem', () => {
        it('returns undefined when item not in queue', () => {
            const q = new QueueArray<Item>();
            const item = makeItem('x');
            expect(q.dequeueItem(item)).toBeUndefined();
        });

        it('removes and returns the exact item by reference', () => {
            const q = new QueueArray<Item>();
            const a = makeItem('a');
            const b = makeItem('b');
            q.enqueue(a);
            q.enqueue(b);
            expect(q.dequeueItem(a)).toBe(a);
            expect(q.size()).toBe(1);
            expect(q.peek()).toBe(b);
        });
    });

    describe('dequeueNotResolved', () => {
        it('returns undefined on empty queue', () => {
            expect(new QueueArray<Item>().dequeueNotResolved()).toBeUndefined();
        });

        it('drains all items and returns them', () => {
            const q = new QueueArray<Item>();
            q.enqueue(makeItem('a'));
            q.enqueue(makeItem('b'));
            const result = q.dequeueNotResolved();
            expect(result).toHaveLength(2);
            expect(q.isEmpty()).toBe(true);
        });

        it('with olderThanMs — returns only stale items', () => {
            const q = new QueueArray<Item>();
            const now = Date.now();
            q.enqueue(makeItem('old', now - 5000));
            q.enqueue(makeItem('fresh', now));
            const result = q.dequeueNotResolved(3000);
            expect(result).toHaveLength(1);
            expect(result?.[0].id).toBe('old');
            expect(q.size()).toBe(1);
        });

        it('with olderThanMs — returns undefined when no stale items', () => {
            const q = new QueueArray<Item>();
            q.enqueue(makeItem('fresh', Date.now()));
            expect(q.dequeueNotResolved(60000)).toBeUndefined();
        });
    });

    describe('clear', () => {
        it('empties the queue', () => {
            const q = new QueueArray<Item>();
            q.enqueue(makeItem('a'));
            q.enqueue(makeItem('b'));
            q.clear();
            expect(q.isEmpty()).toBe(true);
            expect(q.size()).toBe(0);
        });
    });
});
