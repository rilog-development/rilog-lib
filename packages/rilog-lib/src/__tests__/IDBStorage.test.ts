import { IDBFactory } from 'fake-indexeddb';
import IDBStorage from '../utils/IDBStorage';
import { IRilogEventItem } from '../types/events';
import { ERilogEvent } from '../types/events';

const makeEvent = (id: string): IRilogEventItem => ({
    _id: id,
    type: ERilogEvent.REQUEST,
    date: Date.now().toString(),
    data: {} as any,
    location: { origin: null, href: null },
});

describe('IDBStorage', () => {
    let storage: IDBStorage;

    beforeEach(() => {
        // Fresh IDBFactory per test — fully isolated store
        (global as any).indexedDB = new IDBFactory();
        storage = new IDBStorage();
    });

    describe('push + getAll', () => {
        it('stores an event and retrieves it', async () => {
            const event = makeEvent('evt-1');
            await storage.push(event);
            const all = await storage.getAll();
            expect(all).toHaveLength(1);
            expect(all[0]._id).toBe('evt-1');
        });

        it('stores multiple events', async () => {
            await storage.push(makeEvent('a'));
            await storage.push(makeEvent('b'));
            await storage.push(makeEvent('c'));
            const all = await storage.getAll();
            expect(all).toHaveLength(3);
        });
    });

    describe('count', () => {
        it('returns 0 for an empty store', async () => {
            expect(await storage.count()).toBe(0);
        });

        it('returns the correct count after pushes', async () => {
            await storage.push(makeEvent('x1'));
            await storage.push(makeEvent('x2'));
            expect(await storage.count()).toBe(2);
        });
    });

    describe('clearByIds', () => {
        it('removes only the specified events', async () => {
            await storage.push(makeEvent('del-1'));
            await storage.push(makeEvent('del-2'));
            await storage.push(makeEvent('keep-1'));
            await storage.clearByIds(['del-1', 'del-2']);
            const remaining = await storage.getAll();
            expect(remaining).toHaveLength(1);
            expect(remaining[0]._id).toBe('keep-1');
        });

        it('is a no-op for an empty id list', async () => {
            await storage.push(makeEvent('safe'));
            await storage.clearByIds([]);
            expect(await storage.count()).toBe(1);
        });

        it('does not throw for non-existent ids', async () => {
            await expect(storage.clearByIds(['ghost-id'])).resolves.not.toThrow();
        });
    });
});
