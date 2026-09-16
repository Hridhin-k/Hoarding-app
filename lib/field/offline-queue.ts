const DB = "h360-field";
const STORE = "proof-queue";

export type QueuedProof = {
  id?: number;
  jobId: string;
  file: File;
  capturedAt: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  notes?: string;
};

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE, { autoIncrement: true, keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function queueProof(item: QueuedProof) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).add(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getQueuedProofCount() {
  if (typeof indexedDB === "undefined") return 0;
  const db = await openDb();
  return new Promise<number>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function flushProofQueue() {
  if (typeof navigator !== "undefined" && !navigator.onLine) return { uploaded: 0, remaining: await getQueuedProofCount() };
  const db = await openDb();
  const items = await new Promise<Array<QueuedProof & { id: number }>>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  const { completeJobWithProofAction } = await import("@/lib/field/actions");
  let uploaded = 0;
  for (const item of items) {
    const form = new FormData();
    form.set("jobId", item.jobId);
    form.set("photo", item.file);
    form.set("capturedAt", item.capturedAt);
    form.set("latitude", String(item.latitude));
    form.set("longitude", String(item.longitude));
    if (item.accuracy != null) form.set("accuracy", String(item.accuracy));
    if (item.notes) form.set("notes", item.notes);
    const result = await completeJobWithProofAction(form);
    if (!result.error) {
      uploaded += 1;
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).delete(item.id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }
  }
  return { uploaded, remaining: await getQueuedProofCount() };
}
