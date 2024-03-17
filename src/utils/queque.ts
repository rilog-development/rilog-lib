import { Queue } from '../types/queque';

class QueueArray<T> implements Queue<T> {
    private items: T[] = [];

    // Enqueue: Adds an item to the back of the queue.
    enqueue(item: T): void {
        this.items.push(item);
    }

    /**
     * Find some first queue item, delete it and return
     */
    dequeue(queueKey: keyof T, queueValue: T[keyof T]): T | undefined {
        if (!this.items.length) return;

        const queueValueIndex = this.items.findIndex((item) => item[queueKey] === queueValue);

        if (queueValueIndex === -1) return;

        const queueItem = this.items[queueValueIndex];

        // Delete find found queue item (some items be repeated, so we should delete first)
        this.items.splice(queueValueIndex, 1);

        return queueItem;
    }

    /**
     * Return not resolved elements from queue and clear the queue.
     */
    dequeueNotResolved(): T[] | undefined {
        if (!this.items.length) return;

        return this.items.splice(0);
    }

    // Peek: Returns the item at the front of the queue without removing it.
    // Returns undefined if the queue is empty.
    peek(): T | undefined {
        return this.items[0];
    }

    isEmpty(): boolean {
        return this.items.length === 0;
    }

    size(): number {
        return this.items.length;
    }

    clear(): void {
        this.items = [];
    }
}

export default QueueArray;
