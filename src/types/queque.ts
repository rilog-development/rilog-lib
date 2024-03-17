export interface Queue<T> {
    enqueue(item: T): void;
    dequeue(quequeKey: keyof T, quequeValue: T[keyof T]): T | undefined;
    dequeueNotResolved(): T[] | undefined;
    peek(): T | undefined;
    isEmpty(): boolean;
    size(): number;
    clear(): void;
}
