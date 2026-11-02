const DB_NAME = "edteach_offline_store";
const DB_VERSION = 1;
const STORE_NAME = "autosave_backups";

export interface BackupRecord<T> {
  key: string;
  data: T;
  version: number;
  timestamp: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB is not supported in this environment"));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveToOfflineStore<T>(key: string, data: T, version: number): Promise<void> {
  const record: BackupRecord<T> = {
    key,
    data,
    version,
    timestamp: Date.now(),
  };

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // Graceful fallback to localStorage
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`idb_fallback_${key}`, JSON.stringify(record));
      } catch {
        // Storage quota exceeded
      }
    }
  }
}

export async function getFromOfflineStore<T>(key: string): Promise<BackupRecord<T> | null> {
  try {
    const db = await openDB();
    return await new Promise<BackupRecord<T> | null>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    // Check fallback in localStorage
    if (typeof window !== "undefined") {
      try {
        const item = localStorage.getItem(`idb_fallback_${key}`);
        return item ? JSON.parse(item) : null;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function clearOfflineStore(key: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // Fallback
  }
  if (typeof window !== "undefined") {
    localStorage.removeItem(`idb_fallback_${key}`);
  }
}
