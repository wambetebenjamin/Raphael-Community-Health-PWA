import { openDB, type DBSchema } from "idb";
import type {
  ChwProfile,
  ImmunisationRecord,
  Patient,
  PendingRecord,
  QueueKind,
  SyncLogEntry,
  Visit,
} from "@/lib/types";

const DB_NAME = "raphael-community-health";
const DB_VERSION = 1;
const WORKSPACE_STORAGE_KEY = "rchw-workspace-id";
const CONTROL_DB_NAME = "raphael-health-workspace";
let activeWorkspace: string | null = null;

function persistWorkspaceName(name: string) {
  if (typeof indexedDB === "undefined") return;
  try {
    const request = indexedDB.open(CONTROL_DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("active");
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("active", "readwrite");
      tx.objectStore("active").put(`${DB_NAME}:${name}`, "databaseName");
      tx.oncomplete = () => db.close();
      tx.onabort = () => db.close();
    };
  } catch { /* Background sync can still run while the app is open. */ }
}

function workspaceName() {
  if (activeWorkspace === null) {
    try { activeWorkspace = localStorage.getItem(WORKSPACE_STORAGE_KEY) || "local"; } catch { activeWorkspace = "local"; }
    persistWorkspaceName(activeWorkspace);
  }
  return `${DB_NAME}:${activeWorkspace}`;
}

export function setWorkspaceId(id: string | null) {
  if (typeof window === "undefined") return;
  const next = id?.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 32) || "local";
  if (activeWorkspace === next) return;
  activeWorkspace = next;
  try { localStorage.setItem(WORKSPACE_STORAGE_KEY, next === "local" ? "" : next); } catch { /* The current browser session can still change workspace. */ }
  persistWorkspaceName(next);
  dbPromise = undefined;
  dataKeyPromise = undefined;
}

export function getWorkspaceId() {
  workspaceName();
  return activeWorkspace === "local" ? null : activeWorkspace;
}

type HealthStore = "patients" | "visits" | "immunisations";

interface EncryptedRow {
  id: string;
  iv: number[];
  ciphertext: ArrayBuffer;
  updatedAt: string;
}

interface QueueRow extends EncryptedRow {
  kind: QueueKind;
  createdAt: string;
  attempts: number;
  lastError?: string;
}

interface SettingRow {
  key: string;
  value: unknown;
}

interface PinRecord {
  salt: number[];
  hash: number[];
  iterations: number;
}

interface HealthDB extends DBSchema {
  patients: { key: string; value: EncryptedRow };
  visits: { key: string; value: EncryptedRow };
  immunisations: { key: string; value: EncryptedRow };
  syncQueue: { key: string; value: QueueRow };
  syncLogs: { key: string; value: SyncLogEntry };
  keys: { key: string; value: CryptoKey };
  settings: { key: string; value: SettingRow };
}

let dbPromise: ReturnType<typeof openDB<HealthDB>> | undefined;
let dataKeyPromise: Promise<CryptoKey> | undefined;

function database() {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    throw new Error("Offline storage is not available in this browser.");
  }
  if (!dbPromise) {
    dbPromise = openDB<HealthDB>(workspaceName(), DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("patients")) db.createObjectStore("patients", { keyPath: "id" });
        if (!db.objectStoreNames.contains("visits")) db.createObjectStore("visits", { keyPath: "id" });
        if (!db.objectStoreNames.contains("immunisations")) db.createObjectStore("immunisations", { keyPath: "id" });
        if (!db.objectStoreNames.contains("syncQueue")) db.createObjectStore("syncQueue", { keyPath: "id" });
        if (!db.objectStoreNames.contains("syncLogs")) db.createObjectStore("syncLogs", { keyPath: "id" });
        if (!db.objectStoreNames.contains("keys")) db.createObjectStore("keys");
        if (!db.objectStoreNames.contains("settings")) db.createObjectStore("settings", { keyPath: "key" });
      },
    });
  }
  return dbPromise;
}

function getDataKey(): Promise<CryptoKey> {
  if (!globalThis.crypto?.subtle) {
    return Promise.reject(new Error("Secure offline storage needs a modern browser on HTTPS."));
  }
  if (!dataKeyPromise) {
    dataKeyPromise = (async () => {
      const db = await database();
      const candidate = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
      const tx = db.transaction("keys", "readwrite");
      const existing = await tx.store.get("data-key");
      if (existing) {
        await tx.done;
        return existing;
      }
      await tx.store.put(candidate, "data-key");
      await tx.done;
      return candidate;
    })().catch((error) => {
      dataKeyPromise = undefined;
      throw error;
    });
  }
  return dataKeyPromise;
}

async function encrypt(value: unknown, key: CryptoKey) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cleartext = new TextEncoder().encode(JSON.stringify(value));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, cleartext);
  return { iv: Array.from(iv), ciphertext };
}

async function decrypt<T>(row: EncryptedRow, key: CryptoKey): Promise<T> {
  const cleartext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(row.iv) }, key, row.ciphertext);
  return JSON.parse(new TextDecoder().decode(cleartext)) as T;
}

function changed() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("rchw-db-change"));
}

function scheduleBackgroundSync() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  void navigator.serviceWorker.ready.then((registration) => {
    const syncRegistration = registration as ServiceWorkerRegistration & { sync?: { register: (tag: string) => Promise<void> } };
    return syncRegistration.sync?.register("raphael-health-sync");
  }).catch(() => undefined);
}

async function saveRecord<T extends { id: string }>(
  store: HealthStore,
  kind: QueueKind,
  record: T,
  queueForSync = true,
) {
  const db = await database();
  const key = await getDataKey();
  const encrypted = await encrypt(record, key);
  const row: EncryptedRow = { id: record.id, ...encrypted, updatedAt: new Date().toISOString() };
  const pending: PendingRecord | undefined = queueForSync ? {
    id: crypto.randomUUID(),
    kind,
    operation: "upsert",
    createdAt: new Date().toISOString(),
    payload: record,
  } : undefined;
  const queueEncrypted = pending ? await encrypt(pending, key) : undefined;
  const tx = db.transaction([store, "syncQueue"], "readwrite");
  await tx.objectStore(store).put(row);
  if (pending && queueEncrypted) {
    await tx.objectStore("syncQueue").put({
      id: pending.id,
      kind,
      createdAt: pending.createdAt,
      attempts: 0,
      ...queueEncrypted,
      updatedAt: pending.createdAt,
    });
  }
  await tx.done;
  changed();
  if (pending) scheduleBackgroundSync();
}

async function getRecords<T>(store: HealthStore): Promise<T[]> {
  const db = await database();
  const key = await getDataKey();
  const rows = await db.getAll(store);
  const values = await Promise.all(rows.map((row) => decrypt<T>(row, key)));
  return values.sort((a, b) => {
    const aTime = "updatedAt" in (a as object) ? String((a as { updatedAt: string }).updatedAt) : "";
    const bTime = "updatedAt" in (b as object) ? String((b as { updatedAt: string }).updatedAt) : "";
    return bTime.localeCompare(aTime);
  });
}

export async function getPatients() {
  return getRecords<Patient>("patients");
}

export async function getVisits() {
  return getRecords<Visit>("visits");
}

export async function getImmunisations() {
  return getRecords<ImmunisationRecord>("immunisations");
}

export async function savePatient(patient: Patient, queueForSync = true) {
  await saveRecord("patients", "patient", patient, queueForSync);
}

export async function saveVisit(visit: Visit, queueForSync = true) {
  await saveRecord("visits", "visit", visit, queueForSync);
}

export async function saveImmunisation(record: ImmunisationRecord, queueForSync = true) {
  await saveRecord("immunisations", "immunisation", record, queueForSync);
}

export async function queuePublicSubmission(
  kind: Extract<QueueKind, "partnership" | "newsletter" | "contact" | "problem">,
  endpoint: string,
  payload: unknown,
) {
  const db = await database();
  const key = await getDataKey();
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const pending: PendingRecord = { id, kind, operation: "submit", createdAt, payload, endpoint };
  const encrypted = await encrypt(pending, key);
  await db.put("syncQueue", {
    id,
    kind,
    createdAt,
    attempts: 0,
    ...encrypted,
    updatedAt: createdAt,
  });
  changed();
  scheduleBackgroundSync();
  return id;
}

export async function getPendingQueue(): Promise<PendingRecord[]> {
  const db = await database();
  const key = await getDataKey();
  const rows = await db.getAll("syncQueue");
  const entries = await Promise.all(rows.map((row) => decrypt<PendingRecord>(row, key)));
  return entries.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getPendingCount() {
  const db = await database();
  return db.count("syncQueue");
}

export async function removePending(ids: string[]) {
  if (!ids.length) return;
  const db = await database();
  const tx = db.transaction("syncQueue", "readwrite");
  await Promise.all(ids.map((id) => tx.store.delete(id)));
  await tx.done;
  changed();
}

export async function recordQueueAttempt(id: string, message: string) {
  const db = await database();
  const tx = db.transaction("syncQueue", "readwrite");
  const row = await tx.store.get(id);
  if (row) {
    row.attempts += 1;
    row.lastError = message.slice(0, 180);
    await tx.store.put(row);
  }
  await tx.done;
}

export async function saveSyncLog(entry: Omit<SyncLogEntry, "id" | "createdAt"> & { createdAt?: string }) {
  const db = await database();
  const row: SyncLogEntry = {
    id: crypto.randomUUID(),
    createdAt: entry.createdAt ?? new Date().toISOString(),
    status: entry.status,
    message: entry.message,
    count: entry.count,
  };
  const tx = db.transaction("syncLogs", "readwrite");
  await tx.store.put(row);
  const all = await tx.store.getAll();
  all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  await Promise.all(all.slice(20).map((old) => tx.store.delete(old.id)));
  await tx.done;
  changed();
}

export async function getSyncLogs(): Promise<SyncLogEntry[]> {
  const db = await database();
  return (await db.getAll("syncLogs")).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 20);
}

export async function getAppSetting<T>(key: string): Promise<T | undefined> {
  const db = await database();
  return (await db.get("settings", key))?.value as T | undefined;
}

export async function setAppSetting(key: string, value: unknown) {
  const db = await database();
  await db.put("settings", { key, value });
}

export async function getChwProfile(): Promise<ChwProfile> {
  const saved = await getAppSetting<ChwProfile>("chw-profile");
  return saved ?? {
    fullName: "Miriam Ekal",
    chwId: "CHW-20418",
    county: "Turkana",
    subCounty: "Loima",
    ward: "Turkwel",
    demo: true,
  };
}

export async function saveChwProfile(profile: ChwProfile) {
  await setAppSetting("chw-profile", profile);
  changed();
}

export async function hasLocalPin() {
  return Boolean(await getAppSetting<PinRecord>("local-pin"));
}

async function derivePin(pin: string, salt: Uint8Array, iterations: number) {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations, hash: "SHA-256" }, material, 256);
  return new Uint8Array(bits);
}

export async function setLocalPin(pin: string) {
  const iterations = 150_000;
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePin(pin, salt, iterations);
  await setAppSetting("local-pin", { salt: Array.from(salt), hash: Array.from(hash), iterations } satisfies PinRecord);
}

export async function verifyLocalPin(pin: string) {
  const saved = await getAppSetting<PinRecord>("local-pin");
  if (!saved) return true;
  const actual = await derivePin(pin, new Uint8Array(saved.salt), saved.iterations);
  if (actual.length !== saved.hash.length) return false;
  return actual.every((byte, index) => byte === saved.hash[index]);
}

export async function seedDemoData() {
  const db = await database();
  if ((await db.count("patients")) > 0) return;
  const now = new Date().toISOString();
  const patients: Patient[] = [
    {
      id: "RCH-1048",
      fullName: "Amina Ekal (sample)",
      dateOfBirth: "1997-06-13",
      gender: "female",
      village: "Lokiriama",
      householdNumber: "HH-17",
      nextOfKinName: "Naserian Ekal",
      nextOfKinPhone: "",
      chronicConditions: [],
      county: "Turkana",
      subCounty: "Loima",
      ward: "Turkwel",
      followUpDue: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
      createdAt: now,
      updatedAt: now,
      sample: true,
    },
    {
      id: "RCH-1052",
      fullName: "Wanjiku Njeri (sample)",
      dateOfBirth: "2024-02-08",
      gender: "female",
      village: "Kiamokama",
      householdNumber: "HH-08",
      nextOfKinName: "Mary Njeri",
      nextOfKinPhone: "",
      chronicConditions: [],
      county: "Kisii",
      subCounty: "Nyaribari Chache",
      ward: "Kiamokama",
      followUpDue: new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10),
      createdAt: now,
      updatedAt: now,
      sample: true,
    },
    {
      id: "RCH-1067",
      fullName: "Bosire Ondieki (sample)",
      dateOfBirth: "1989-09-26",
      gender: "male",
      village: "Ilbissil",
      householdNumber: "HH-22",
      nextOfKinName: "Ruth Bosire",
      nextOfKinPhone: "",
      chronicConditions: ["Hypertension"],
      county: "Kajiado",
      subCounty: "Kajiado Central",
      ward: "Ilbissil",
      followUpDue: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
      createdAt: now,
      updatedAt: now,
      sample: true,
    },
    {
      id: "RCH-1081",
      fullName: "Mwanaidi Juma (sample)",
      dateOfBirth: "1995-12-02",
      gender: "female",
      village: "Matsangoni",
      householdNumber: "HH-31",
      nextOfKinName: "Salim Juma",
      nextOfKinPhone: "",
      chronicConditions: [],
      county: "Kilifi",
      subCounty: "Kilifi North",
      ward: "Matsangoni",
      followUpDue: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      createdAt: now,
      updatedAt: now,
      sample: true,
    },
  ];
  const visits: Visit[] = [
    {
      id: "VIS-031",
      patientId: "RCH-1048",
      visitedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
      visitType: "ANC",
      temperature: 36.8,
      weightKg: 61.4,
      bloodPressure: "112/72",
      chiefComplaint: "Routine antenatal follow-up",
      interventions: "Health education and next visit planned",
      referral: false,
      createdAt: now,
      sample: true,
    },
    {
      id: "VIS-029",
      patientId: "RCH-1052",
      visitedAt: new Date(Date.now() - 25 * 3600000).toISOString(),
      visitType: "follow-up",
      weightKg: 7.2,
      chiefComplaint: "Growth monitoring",
      interventions: "Caregiver counselling",
      referral: false,
      createdAt: now,
      sample: true,
    },
  ];
  const immunisations: ImmunisationRecord[] = [
    {
      id: "IMM-014",
      patientId: "RCH-1052",
      vaccine: "BCG",
      dose: "Birth dose",
      dateGiven: "2024-02-09",
      dueDate: "2024-02-08",
      status: "given",
      createdAt: now,
      sample: true,
    },
    {
      id: "IMM-015",
      patientId: "RCH-1052",
      vaccine: "Pentavalent 1",
      dose: "Dose 1",
      dueDate: "2024-04-08",
      status: "overdue",
      createdAt: now,
      sample: true,
    },
  ];
  const key = await getDataKey();
  const [encryptedPatients, encryptedVisits, encryptedImmunisations] = await Promise.all([
    Promise.all(patients.map(async (record) => ({ id: record.id, ...(await encrypt(record, key)), updatedAt: now }))),
    Promise.all(visits.map(async (record) => ({ id: record.id, ...(await encrypt(record, key)), updatedAt: now }))),
    Promise.all(immunisations.map(async (record) => ({ id: record.id, ...(await encrypt(record, key)), updatedAt: now }))),
  ]);
  const tx = db.transaction(["patients", "visits", "immunisations"], "readwrite");
  for (const row of encryptedPatients) await tx.objectStore("patients").put(row);
  for (const row of encryptedVisits) await tx.objectStore("visits").put(row);
  for (const row of encryptedImmunisations) await tx.objectStore("immunisations").put(row);
  await tx.done;
  const profile = await getChwProfile();
  await saveChwProfile(profile);
  await saveSyncLog({ status: "info", message: "Sample training records loaded on this device." });
  changed();
}

export async function exportOfflineCsv() {
  const [patients, visits, immunisations] = await Promise.all([getPatients(), getVisits(), getImmunisations()]);
  const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const lines = [
    ["record_type", "record_id", "patient_id", "name_or_type", "date", "details"].map(escape).join(","),
    ...patients.map((patient) => ["patient", patient.id, patient.id, patient.fullName, patient.dateOfBirth, `${patient.village}; ${patient.county}`].map(escape).join(",")),
    ...visits.map((visit) => ["visit", visit.id, visit.patientId, visit.visitType, visit.visitedAt, visit.chiefComplaint].map(escape).join(",")),
    ...immunisations.map((record) => ["immunisation", record.id, record.patientId, record.vaccine, record.dateGiven ?? record.dueDate, record.status].map(escape).join(",")),
  ];
  return lines.join("\r\n");
}
