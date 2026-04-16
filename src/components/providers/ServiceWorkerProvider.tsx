"use client";

import { useEffect } from "react";

interface ServiceWorkerProviderProps {
  children: React.ReactNode;
  onSyncQueue?: () => void;
}

export function ServiceWorkerProvider({
  children,
  onSyncQueue,
}: ServiceWorkerProviderProps) {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    // Register SW
     navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        console.log("[ProofChain SW] Registered:", registration.scope);

        // Request background sync permission when available
        if ("sync" in registration) {
          // Tag the sync so SW can trigger queue upload on reconnect
          navigator.serviceWorker.ready.then((reg) => {
            // @ts-expect-error – SyncManager types not in all TS versions
            reg.sync?.register("evidence-upload-queue").catch(() => {
              // Background sync not supported — fallback handled by useOfflineQueue
            });
          });
        }
      })
      .catch((err) => {
        console.warn("[ProofChain SW] Registration failed:", err);
      });

    // Listen for SYNC_QUEUE messages from the SW
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "SYNC_QUEUE" && onSyncQueue) {
        onSyncQueue();
      }
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);
    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
    };
  }, [onSyncQueue]);

  return <>{children}</>;
}