import { IRilogEventItem } from '../types/events';
import { IEventStorage } from '../types/storage';

const DB_NAME = 'rilog_db';
const STORE_NAME = 'events';
const DB_VERSION = 1;

class IDBStorage implements IEventStorage {
    private db: IDBDatabase | null = null;

    private openDB(): Promise<IDBDatabase> {
        if (this.db) return Promise.resolve(this.db);

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (e) => {
                const db = (e.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: '_id' });
                }
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onerror = () => reject(request.error);
        });
    }

    async push(event: IRilogEventItem): Promise<void> {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).add(event);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(tx.error);
        });
    }

    async getAll(): Promise<IRilogEventItem[]> {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const req = tx.objectStore(STORE_NAME).getAll();
            req.onsuccess = () => resolve(req.result as IRilogEventItem[]);
            req.onerror = () => reject(req.error);
        });
    }

    async clearByIds(ids: string[]): Promise<void> {
        if (!ids.length) return;
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            ids.forEach((id) => store.delete(id));
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(tx.error);
        });
    }

    async count(): Promise<number> {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const req = tx.objectStore(STORE_NAME).count();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }
}

export default IDBStorage;
