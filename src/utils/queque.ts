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
     * Remove a specific item from the queue by reference and return it.
     */
    dequeueItem(item: T): T | undefined {
        const idx = this.items.indexOf(item);
        if (idx === -1) return undefined;
        return this.items.splice(idx, 1)[0];
    }

    /**
     * Return not resolved elements from queue and clear the queue.
     * If olderThanMs is provided, only returns and removes items older than that threshold.
     */
    dequeueNotResolved(olderThanMs?: number): T[] | undefined {
        if (!this.items.length) return;

        if (olderThanMs !== undefined) {
            const now = Date.now();
            const timedOut = this.items.filter((item: any) => typeof item.timestamp === 'number' && now - item.timestamp > olderThanMs);
            timedOut.forEach((item) => {
                const idx = this.items.indexOf(item);
                if (idx !== -1) this.items.splice(idx, 1);
            });
            return timedOut.length ? timedOut : undefined;
        }

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
