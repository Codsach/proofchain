import { useState, useEffect, useCallback } from "react";

export interface QueuedSubmission {
  id: string;
  caseId: string;
  title: string;
  description: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileBlob: Blob;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  gpsAccuracy: number | null;
  capturedAt: string | null;
  captureMethod: string;
  deviceInfo: string | null;
  queuedAt: Date;
  retryCount: number;
  status: "queued" | "uploading" | "failed";
  error?: string;
}

const DB_NAME = "proofchain_offline";
const STORE_NAME = "evidence_queue";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAllQueued(): Promise<QueuedSubmission[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function putQueued(item: QueuedSubmission): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(item);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function deleteQueued(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

interface UseOfflineQueueReturn {
  queue: QueuedSubmission[];
  isOnline: boolean;
  addToQueue: (submission: Omit<QueuedSubmission, "id" | "queuedAt" | "retryCount" | "status">) => Promise<string>;
  syncQueue: () => Promise<void>;
  removeFromQueue: (id: string) => Promise<void>;
  isSyncing: boolean;
  pendingCount: number;
}

export function useOfflineQueue(getAuthToken: () => (string | null) | Promise<string | null>): UseOfflineQueueReturn {
  const [queue, setQueue] = useState<QueuedSubmission[]>([]);
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load queue from IndexedDB
  const loadQueue = useCallback(async () => {
    try {
      const items = await getAllQueued();
      setQueue(items);
    } catch {
      console.error("Failed to load offline queue");
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  // Online/offline listeners
  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true);
    };
    const onOffline = () => setIsOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && queue.filter((q) => q.status === "queued").length > 0) {
      syncQueue();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  const addToQueue = useCallback(
    async (
      submission: Omit<QueuedSubmission, "id" | "queuedAt" | "retryCount" | "status">
    ): Promise<string> => {
      const id = `offline_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const item: QueuedSubmission = {
        ...submission,
        id,
        queuedAt: new Date(),
        retryCount: 0,
        status: "queued",
      };
      await putQueued(item);
      setQueue((prev) => [...prev, item]);
      return id;
    },
    []
  );

  const removeFromQueue = useCallback(async (id: string) => {
    await deleteQueued(id);
    setQueue((prev) => prev.filter((q) => q.id !== id));
  }, []);

  const syncQueue = useCallback(async () => {
    if (isSyncing) return;
    const token = await getAuthToken();
    if (!token) return;

    setIsSyncing(true);

    try {
      const pending = await getAllQueued();
      const toSync = pending.filter((q) => q.status === "queued" && q.retryCount < 3);

      for (const item of toSync) {
        // Mark as uploading
        const uploading = { ...item, status: "uploading" as const };
        await putQueued(uploading);
        setQueue((prev) => prev.map((q) => (q.id === item.id ? uploading : q)));

        try {
          const formData = new FormData();
          formData.append("file", item.fileBlob, item.fileName);
          formData.append("caseId", item.caseId);
          formData.append("title", item.title);
          formData.append("description", item.description);
          formData.append("captureMethod", item.captureMethod);
          if (item.latitude !== null) formData.append("latitude", String(item.latitude));
          if (item.longitude !== null) formData.append("longitude", String(item.longitude));
          if (item.altitude !== null) formData.append("altitude", String(item.altitude));
          if (item.gpsAccuracy !== null) formData.append("gpsAccuracy", String(item.gpsAccuracy));
          if (item.capturedAt) formData.append("capturedAt", item.capturedAt);
          if (item.deviceInfo) formData.append("deviceInfo", item.deviceInfo);
          formData.append("offlineQueueId", item.id);

          const res = await fetch("/api/evidence/upload", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });

          if (res.ok) {
            // Remove from queue on success
            await deleteQueued(item.id);
            setQueue((prev) => prev.filter((q) => q.id !== item.id));
          } else {
            const err = await res.json().catch(() => ({ error: "Upload failed" }));
            const failed: QueuedSubmission = {
              ...item,
              status: item.retryCount >= 2 ? "failed" : "queued",
              retryCount: item.retryCount + 1,
              error: err.error || "Upload failed",
            };
            await putQueued(failed);
            setQueue((prev) => prev.map((q) => (q.id === item.id ? failed : q)));
          }
        } catch {
          const failed: QueuedSubmission = {
            ...item,
            status: item.retryCount >= 2 ? "failed" : "queued",
            retryCount: item.retryCount + 1,
            error: "Network error",
          };
          await putQueued(failed);
          setQueue((prev) => prev.map((q) => (q.id === item.id ? failed : q)));
        }
      }
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, getAuthToken]);

  const pendingCount = queue.filter((q) => q.status === "queued").length;

  return {
    queue,
    isOnline,
    addToQueue,
    syncQueue,
    removeFromQueue,
    isSyncing,
    pendingCount,
  };
}