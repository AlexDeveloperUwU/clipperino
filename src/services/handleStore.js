const DB_NAME = "clipperino";
const STORE = "handles";
const VIDEO_KEY = "video";

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function run(mode, action) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = action(tx.objectStore(STORE));
    tx.oncomplete = () => {
      db.close();
      resolve(request.result);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

/** Remembers the video's file handle so it can be reopened later; failures are ignored. */
export async function saveVideoHandle(handle) {
  await run("readwrite", (store) => store.put(handle, VIDEO_KEY)).catch(() => undefined);
}

/** The remembered video file handle, or null when none is stored or storage is unavailable. */
export async function loadVideoHandle() {
  return (await run("readonly", (store) => store.get(VIDEO_KEY)).catch(() => null)) ?? null;
}

/** Forgets the remembered video file handle. */
export async function clearVideoHandle() {
  await run("readwrite", (store) => store.delete(VIDEO_KEY)).catch(() => undefined);
}
