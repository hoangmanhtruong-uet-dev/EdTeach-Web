/**
 * Lightweight browser IndexedDB helper with automatic localStorage fallback.
 * Zero external dependencies.
 */

const DB_NAME = "edteach_autosave_v1";
const STORE_NAME = "drafts";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase | null> | null = null;

function getDb(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !window.indexedDB) {
    return Promise.resolve(null);
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      try {
        const req = window.indexedDB.open(DB_NAME, DB_VERSION);

        req.onupgradeneeded = (e: any) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
            store.createIndex("updatedAt", "updatedAt", { unique: false });
            store.createIndex("synced", "synced", { unique: false });
          }
        };

        req.onsuccess = (e: any) => resolve(e.target.result);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  return dbPromise;
}

export interface AutosaveDraftRecord<T = unknown> {
  id: string;
  data: T;
  version: number;
  updatedAt: number;
  synced: boolean;
}

export async function saveDraftToStorage<T>(
  id: string,
  data: T,
  version: number,
  synced = false
): Promise<void> {
  const record: AutosaveDraftRecord<T> = {
    id,
    data,
    version,
    updatedAt: Date.now(),
    synced,
  };

  // 1. Try IndexedDB
  try {
    const db = await getDb();
    if (db) {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    }
  } catch (err) {
    console.warn("[IndexedDB] Could not save draft, falling back to localStorage:", err);
  }

  // 2. Also keep a copy in localStorage for immediate sync recovery
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`edteach_draft_${id}`, JSON.stringify(record));
    } catch {
      // Quota exceeded in localStorage, ignored since IndexedDB was attempted
    }
  }
}

export async function getDraftFromStorage<T>(id: string): Promise<AutosaveDraftRecord<T> | null> {
  // 1. Try IndexedDB
  try {
    const db = await getDb();
    if (db) {
      const record = await new Promise<AutosaveDraftRecord<T> | null>((resolve) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
      if (record) return record;
    }
  } catch (err) {
    console.warn("[IndexedDB] Read error, trying localStorage:", err);
  }

  // 2. Fallback to localStorage
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(`edteach_draft_${id}`);
      if (raw) return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  return null;
}

export async function removeDraftFromStorage(id: string): Promise<void> {
  try {
    const db = await getDb();
    if (db) {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(id);
    }
  } catch {
    // ignore
  }

  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(`edteach_draft_${id}`);
    } catch {
      // ignore
    }
  }
}
