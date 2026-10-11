"use client";

import { useEffect } from "react";
import { getPendingQueue } from "@/lib/offline-db";
import { processPendingRecords } from "@/lib/sync";

export function PublicQueueSync() {
  useEffect(() => {
    let running = false;
    const tryPublicQueue = async () => {
      if (!navigator.onLine || running) return;
      running = true;
      try {
        const queue = await getPendingQueue().catch(() => []);
        if (queue.some((record) => !["patient", "visit", "immunisation"].includes(record.kind))) {
          await processPendingRecords({ authenticated: false, publicForms: true }).catch(() => undefined);
        }
      } finally {
        running = false;
      }
    };
    const handleDatabaseChange = () => { void tryPublicQueue(); };
    void tryPublicQueue();
    window.addEventListener("online", tryPublicQueue);
    window.addEventListener("rchw-db-change", handleDatabaseChange);
    return () => {
      window.removeEventListener("online", tryPublicQueue);
      window.removeEventListener("rchw-db-change", handleDatabaseChange);
    };
  }, []);
  return null;
}
