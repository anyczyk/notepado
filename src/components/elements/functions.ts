// functions.ts
export interface FormData {
    id: number;
    title: string;
    description: string;
    date: string;
}

export const openDB = async (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('myDatabase', 1);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains('formData')) {
                db.createObjectStore('formData', { keyPath: 'id', autoIncrement: true });
            }
        };

        request.onsuccess = (event) => {
            resolve((event.target as IDBOpenDBRequest).result);
        };

        request.onerror = (event) => {
            reject((event.target as IDBOpenDBRequest).error);
        };
    });
};

export const saveData = async (data: FormData): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction('formData', 'readwrite');
    const store = transaction.objectStore('formData');
    store.put(data);
};

export const loadAllData = async (): Promise<FormData[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('formData', 'readonly');
        const store = transaction.objectStore('formData');
        const request = store.getAll();

        request.onsuccess = (event) => {
            resolve((event.target as IDBRequest<FormData[]>).result);
        };

        request.onerror = (event) => {
            reject((event.target as IDBRequest).error);
        };
    });
};

export const deleteData = async (id: number): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction('formData', 'readwrite');
    const store = transaction.objectStore('formData');
    store.delete(id);
};

export const isValidFormData = (data: any): data is FormData => {
    return (
        typeof data === 'object' &&
        data !== null &&
        typeof data.id === 'number' &&
        typeof data.title === 'string' &&
        typeof data.description === 'string' &&
        typeof data.date === 'string'
    );
};

export const saveDataToStorage = (key: string, value: string): void => {
    localStorage.setItem(key, value);
};

export const loadDataFromStorage = (key: string): string | null => {
    return localStorage.getItem(key);
};
