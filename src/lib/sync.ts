import { getRecaptchaToken } from "@/lib/captcha-client";
import {
  getPendingQueue,
  recordQueueAttempt,
  removePending,
  saveSyncLog,
} from "@/lib/offline-db";
import type { PendingRecord } from "@/lib/types";

export interface SyncResult {
  synced: number;
  pending: number;
  needsAuth?: boolean;
  message: string;
}

const healthKinds = new Set(["patient", "visit", "immunisation"]);
const publicEndpoints: Record<string, string> = {
  partnership: "/api/partnership",
  newsletter: "/api/newsletter",
  contact: "/api/contact",
  problem: "/api/contact",
};

function isOnline() {
  return typeof navigator === "undefined" || navigator.onLine;
}

export async function requestBackgroundSync() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    const syncRegistration = registration as ServiceWorkerRegistration & {
      sync?: { register: (tag: string) => Promise<void> };
    };
    await syncRegistration.sync?.register("raphael-health-sync");
  } catch {
    // The app also retries when the page sees the browser's online event.
  }
}

async function postHealthBatch(records: PendingRecord[]) {
  const payload = records.map((record) => ({
    queueId: record.id,
    kind: record.kind,
    operation: record.operation,
    createdAt: record.createdAt,
    payload: record.payload,
  }));
  const response = await fetch("/api/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    cache: "no-store",
    body: JSON.stringify({ records: payload }),
  });
  const data = (await response.json().catch(() => ({}))) as {
    confirmedIds?: string[];
    error?: string;
    message?: string;
  };
  if (response.status === 401 || response.status === 403) {
    return { needsAuth: true, confirmedIds: [] as string[], message: data.message ?? "Sign in to sync to a county server." };
  }
  if (!response.ok) throw new Error(data.message ?? data.error ?? "The secure sync endpoint is unavailable.");
  return {
    confirmedIds: data.confirmedIds ?? records.map((record) => record.id),
    message: data.message ?? "Records synced securely.",
    needsAuth: false,
  };
}

async function postPublicRecord(record: PendingRecord) {
  const endpoint = record.endpoint ?? publicEndpoints[record.kind];
  if (!endpoint) throw new Error("No destination is configured for this queued form.");
  const action = endpoint.split("/").pop() ?? "contact";
  const token = await getRecaptchaToken(action);
  const payload = typeof record.payload === "object" && record.payload !== null
    ? (record.payload as Record<string, unknown>)
    : { message: String(record.payload ?? "") };
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ ...payload, captchaToken: token, captchaVersion: "v3" }),
  });
  const data = (await response.json().catch(() => ({}))) as { message?: string; error?: string };
  if (!response.ok) throw new Error(data.message ?? data.error ?? "The queued form could not be delivered yet.");
  return data.message ?? "Queued form delivered.";
}

export async function processPendingRecords(options: { authenticated: boolean; publicForms?: boolean }): Promise<SyncResult> {
  if (!isOnline()) return { synced: 0, pending: await safePendingCount(), message: "Offline. Changes remain saved on this device." };
  const queue = await getPendingQueue();
  if (!queue.length) return { synced: 0, pending: 0, message: "Everything is up to date." };

  const healthQueue = queue.filter((record) => healthKinds.has(record.kind));
  const publicQueue = queue.filter((record) => !healthKinds.has(record.kind));
  let synced = 0;
  let needsAuth = false;
  const messages: string[] = [];

  if (healthQueue.length && !options.authenticated) {
    needsAuth = true;
    messages.push("Sign in to sync patient records to your county workspace.");
    await saveSyncLog({ status: "info", message: "Patient records remain encrypted on this device until a CHW signs in." });
  } else if (healthQueue.length) {
    try {
      const result = await postHealthBatch(healthQueue);
      needsAuth = Boolean(result.needsAuth);
      if (result.confirmedIds.length) {
        await removePending(result.confirmedIds);
        synced += result.confirmedIds.length;
      }
      messages.push(result.message);
      if (result.needsAuth) {
        await saveSyncLog({ status: "info", message: "Sign in to sync patient records to a county workspace." });
      } else if (result.confirmedIds.length) {
        await saveSyncLog({ status: "success", message: "Secure sync completed.", count: result.confirmedIds.length });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sync did not complete.";
      await Promise.all(healthQueue.map((record) => recordQueueAttempt(record.id, message)));
      await saveSyncLog({ status: "failed", message: `Secure sync paused: ${message}` });
      messages.push(message);
    }
  }

  if (options.publicForms && publicQueue.length) {
    for (const record of publicQueue) {
      try {
        await postPublicRecord(record);
        await removePending([record.id]);
        synced += 1;
        await saveSyncLog({ status: "success", message: "A queued enquiry was delivered.", count: 1 });
      } catch (error) {
        const message = error instanceof Error ? error.message : "The queued form could not be delivered yet.";
        await recordQueueAttempt(record.id, message);
        messages.push(message);
      }
    }
  }

  const pending = await safePendingCount();
  if (synced > 0) await requestBackgroundSync();
  return {
    synced,
    pending,
    needsAuth,
    message: messages[0] ?? (pending ? `${pending} item${pending === 1 ? "" : "s"} still waiting.` : "Everything is up to date."),
  };
}

async function safePendingCount() {
  const queue = await getPendingQueue().catch(() => []);
  return queue.length;
}
