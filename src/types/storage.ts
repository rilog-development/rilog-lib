import { IRilogEventItem } from './events';

export interface IEventStorage {
    push(event: IRilogEventItem): Promise<void>;
    getAll(): Promise<IRilogEventItem[]>;
    clearByIds(ids: string[]): Promise<void>;
    count(): Promise<number>;
}
