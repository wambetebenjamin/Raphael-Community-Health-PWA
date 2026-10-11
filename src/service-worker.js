import { BackgroundSyncPlugin } from "workbox-background-sync";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { ExpirationPlugin } from "workbox-expiration";
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { registerRoute, setCatchHandler } from "workbox-routing";
import { CacheFirst, NetworkFirst, NetworkOnly } from "workbox-strategies";

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

registerRoute(
  ({ request }) => ["script", "style", "font", "image"].includes(request.destination),
  new CacheFirst({
    cacheName: "raphael-shell-assets-v1",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 180, maxAgeSeconds: 60 * 60 * 24 * 90 }),
    ],
  }),
);

registerRoute(
  ({ url, request }) => request.method === "POST" && ["/api/partnership", "/api/newsletter", "/api/contact"].includes(url.pathname),
  new NetworkOnly({
    plugins: [
      new BackgroundSyncPlugin("raphael-public-form-submissions", {
        maxRetentionTime: 24 * 60,
      }),
    ],
  }),
  "POST",
);

registerRoute(
  ({ url, request }) => url.pathname.startsWith("/api/") && request.method === "POST" && !["/api/partnership", "/api/newsletter", "/api/contact"].includes(url.pathname),
  new NetworkOnly(),
  "POST",
);

registerRoute(
  ({ url, request }) => url.pathname.startsWith("/api/") && request.method === "GET",
  new NetworkFirst({
    cacheName: "raphael-public-api-v1",
    networkTimeoutSeconds: 3,
    plugins: [
      {
        cacheWillUpdate: async ({ request, response }) => {
          const url = new URL(request.url);
          if (!url.pathname.startsWith("/api/public/")) return null;
          return response.status === 200 ? response : null;
        },
      },
      new ExpirationPlugin({ maxEntries: 12, maxAgeSeconds: 60 * 5 }),
    ],
  }),
  "GET",
);

registerRoute(
  ({ request }) => request.mode === "navigate",
  new NetworkFirst({
    cacheName: "raphael-pages-v1",
    networkTimeoutSeconds: 3,
    plugins: [new ExpirationPlugin({ maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 14 })],
  }),
);

async function readLocalQueue() {
  const control = await new Promise((resolve, reject) => {
    const request = indexedDB.open("raphael-health-workspace", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("active");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const databaseName = await new Promise((resolve, reject) => {
    const request = control.transaction("active", "readonly").objectStore("active").get("databaseName");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  control.close();
  if (typeof databaseName !== "string") return { db: null, records: [] };
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = () => request.transaction.abort();
  });
  const key = await new Promise((resolve, reject) => {
    const request = db.transaction("keys", "readonly").objectStore("keys").get("data-key");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  if (!key) return { db, records: [] };
  const rows = await new Promise((resolve, reject) => {
    const request = db.transaction("syncQueue", "readonly").objectStore("syncQueue").getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
  const records = [];
  for (const row of rows) {
    if (!["patient", "visit", "immunisation"].includes(row.kind)) continue;
    try {
      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: new Uint8Array(row.iv) },
        key,
        row.ciphertext,
      );
      records.push({ rowId: row.id, item: JSON.parse(new TextDecoder().decode(decrypted)) });
    } catch {
      // Leave a record in the local queue if this browser cannot decrypt it.
    }
  }
  return { db, records };
}

async function syncLocalQueue() {
  const { db, records } = await readLocalQueue();
  if (!db || !records.length) {
    db?.close();
    return;
  }
  const response = await fetch("/api/sync", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      records: records.map(({ rowId, item }) => ({
        queueId: rowId,
        kind: item.kind,
        operation: item.operation,
        createdAt: item.createdAt,
        payload: item.payload,
      })),
    }),
  });
  if (!response.ok) {
    db.close();
    throw new Error(`Offline sync returned ${response.status}`);
  }
  const result = await response.json();
  const ids = new Set(result.confirmedIds || records.map(({ rowId }) => rowId));
  const tx = db.transaction("syncQueue", "readwrite");
  const store = tx.objectStore("syncQueue");
  for (const { rowId } of records) if (ids.has(rowId)) store.delete(rowId);
  await new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(undefined);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
  db.close();
}

self.addEventListener("sync", (event) => {
  if (event.tag === "raphael-health-sync") event.waitUntil(syncLocalQueue());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "RAPHAEL_SYNC_NOW") event.waitUntil(syncLocalQueue());
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

setCatchHandler(async ({ request, url }) => {
  if (url.pathname.startsWith("/api/")) {
    return new Response(
      JSON.stringify({ ok: false, offline: true, message: "Saved on this device. Sync when a secure connection is available." }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }
  if (request.mode === "navigate") {
    const fallback = await caches.match("/offline.html");
    if (fallback) return fallback;
  }
  return Response.error();
});
