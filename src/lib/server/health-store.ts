import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { kvCommand, kvHashDelete, kvHashGetAll, kvHashSet } from "@/lib/server/kv";
import type { CountyName, HealthRecordKind } from "@/lib/types";

const storageNames: Record<HealthRecordKind, string> = {
  patient: "patients",
  visit: "visits",
  immunisation: "immunisations",
};

type Envelope = { version: 1; iv: string; tag: string; ciphertext: string };

function accountHash(userId: string, kind: HealthRecordKind) {
  return `raphael:account:${userId}:${storageNames[kind]}`;
}

function encryptionKey() {
  const value = process.env.RCHW_DATA_ENCRYPTION_KEY;
  if (!value) throw new Error("Server-side health data encryption is not configured.");
  const key = /^[0-9a-f]{64}$/i.test(value) ? Buffer.from(value, "hex") : Buffer.from(value, "base64url");
  if (key.length !== 32) throw new Error("Server-side health data encryption key must be 32 bytes.");
  return key;
}

export function healthStorageConfigured() {
  try { encryptionKey(); return true; } catch { return false; }
}

function seal(value: unknown): Envelope {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return {
    version: 1,
    iv: iv.toString("base64url"),
    tag: cipher.getAuthTag().toString("base64url"),
    ciphertext: ciphertext.toString("base64url"),
  };
}

function open<T>(envelope: Envelope): T {
  if (!envelope || envelope.version !== 1) throw new Error("Stored health data could not be read.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(envelope.iv, "base64url"));
  decipher.setAuthTag(Buffer.from(envelope.tag, "base64url"));
  const clear = Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext, "base64url")), decipher.final()]);
  return JSON.parse(clear.toString("utf8")) as T;
}

export async function listHealthRecords<T>(userId: string, kind: HealthRecordKind) {
  const rows = await kvHashGetAll<Envelope>(accountHash(userId, kind));
  return Object.values(rows).map((row) => open<T>(row));
}

export async function upsertHealthRecord(userId: string, kind: HealthRecordKind, id: string, value: unknown) {
  return kvHashSet(accountHash(userId, kind), id, seal(value));
}

export async function deleteHealthRecord(userId: string, kind: HealthRecordKind, id: string) {
  return kvHashDelete(accountHash(userId, kind), id);
}

export async function listCountyAccounts(county: CountyName) {
  const result = await kvCommand<string[]>(["SMEMBERS", `raphael:county:${county}:chws`]);
  return Array.isArray(result) ? result : [];
}
