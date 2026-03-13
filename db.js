const DB_NAME = 'BankingWarModeDB';
const DB_VERSION = 1;

const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            if (!db.objectStoreNames.contains('subjects')) {
                db.createObjectStore('subjects', { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains('topics')) {
                const topicStore = db.createObjectStore('topics', { keyPath: 'id', autoIncrement: true });
                topicStore.createIndex('subject_id', 'subject_id', { unique: false });
            }
            if (!db.objectStoreNames.contains('study_sessions')) {
                const sessionStore = db.createObjectStore('study_sessions', { keyPath: 'id', autoIncrement: true });
                sessionStore.createIndex('date', 'date', { unique: false });
                sessionStore.createIndex('topic_id', 'topic_id', { unique: false });
            }
            if (!db.objectStoreNames.contains('daily_activity')) {
                db.createObjectStore('daily_activity', { keyPath: 'date' });
            }
            if (!db.objectStoreNames.contains('mock_tests')) {
                db.createObjectStore('mock_tests', { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains('battle_plans')) {
                db.createObjectStore('battle_plans', { keyPath: 'date' });
            }
            if (!db.objectStoreNames.contains('future_self')) {
                db.createObjectStore('future_self', { keyPath: 'id', autoIncrement: true });
            }
        };

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            console.error('Database error:', event.target.error);
            reject(event.target.error);
        };
    });
};

const DB = {
    async getStore(storeName, mode = 'readonly') {
        const db = await openDB();
        return db.transaction(storeName, mode).objectStore(storeName);
    },

    async add(storeName, data) {
        const store = await this.getStore(storeName, 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.add(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async put(storeName, data) {
        const store = await this.getStore(storeName, 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.put(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async getAll(storeName) {
        const store = await this.getStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async get(storeName, key) {
        const store = await this.getStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async delete(storeName, key) {
        const store = await this.getStore(storeName, 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.delete(key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
};

window.DB = DB;
