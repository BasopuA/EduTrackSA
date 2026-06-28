const DB_NAME = "edutrack-sa-offline";
const DB_VERSION = 1;
const CONTENT_STORE = "contents";
const SYNC_STORE = "syncQueue";
const SETTINGS_STORE = "settings";

interface OfflineContent {
  id: number;
  title: string;
  subject?: string | null;
  grade_level?: string | null;
  content_type?: string;
  text_content: string;
  updated_at: string;
}

interface SyncQueueItem {
  id: string;
  method: "POST" | "PUT" | "PATCH";
  url: string;
  body: unknown;
  createdAt: string;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(CONTENT_STORE)) {
        db.createObjectStore(CONTENT_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(SYNC_STORE)) {
        db.createObjectStore(SYNC_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveOfflineContents(contents: OfflineContent[]) {
  const db = await openDb();

  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(CONTENT_STORE, "readwrite");
    const store = transaction.objectStore(CONTENT_STORE);
    contents.forEach((content) => store.put(content));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getCachedContents(): Promise<OfflineContent[]> {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CONTENT_STORE, "readonly");
    const store = transaction.objectStore(CONTENT_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function enqueueSync(item: Omit<SyncQueueItem, "id" | "createdAt">) {
  const db = await openDb();

  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(SYNC_STORE, "readwrite");
    const store = transaction.objectStore(SYNC_STORE);
    store.put({
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      createdAt: new Date().toISOString(),
    });
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SYNC_STORE, "readonly");
    const store = transaction.objectStore(SYNC_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function clearSyncQueueItem(id: string) {
  const db = await openDb();

  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(SYNC_STORE, "readwrite");
    const store = transaction.objectStore(SYNC_STORE);
    store.delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function setOfflinePreference(key: "dataSaving" | "offlineReady", value: boolean) {
  const db = await openDb();

  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(SETTINGS_STORE, "readwrite");
    const store = transaction.objectStore(SETTINGS_STORE);
    store.put({ key, value });
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getOfflinePreference(key: "dataSaving" | "offlineReady") {
  const db = await openDb();

  return new Promise<boolean | undefined>((resolve, reject) => {
    const transaction = db.transaction(SETTINGS_STORE, "readonly");
    const store = transaction.objectStore(SETTINGS_STORE);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result?.value);
    request.onerror = () => reject(request.error);
  });
}
