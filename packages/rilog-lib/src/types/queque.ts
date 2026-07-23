export interface Queue<T> {
    enqueue(item: T): void;
    dequeue(quequeKey: keyof T, quequeValue: T[keyof T]): T | undefined;
    dequeueItem(item: T): T | undefined;
    dequeueNotResolved(olderThanMs?: number): T[] | undefined;
    peek(): T | undefined;
    isEmpty(): boolean;
    size(): number;
    clear(): void;
}
