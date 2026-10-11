import "server-only";
import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import type { NextResponse } from "next/server";
import type { CountyName } from "@/lib/types";
import { kvGetJson, kvSetJsonIfMissing, kvSetAdd } from "@/lib/server/kv";

const COOKIE_NAME = "rchw_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

export type ChwSession = {
  sub: string;
  county: CountyName;
  role: "chw" | "county";
  exp: number;
};

export type ChwAccount = {
  id: string;
  fullName: string;
  county: CountyName;
  subCounty: string;
  ward: string;
  email: string;
  phone: string;
  pinSalt: string;
  pinHash: string;
  createdAt: string;
  role: "chw" | "county";
};

function secret() {
  return process.env.RCHW_SESSION_SECRET;
}

function signature(value: string) {
  const key = secret();
  if (!key || key.length < 32) throw new Error("A 32-character session secret is required.");
  return createHmac("sha256", key).update(value).digest("base64url");
}

export function createSessionToken(account: Pick<ChwAccount, "id" | "county" | "role">) {
  const payload: ChwSession = {
    sub: account.id,
    county: account.county,
    role: account.role,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${signature(encoded)}`;
}

export function getSession(request: Request): ChwSession | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookie = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE_NAME}=`));
  if (!cookie) return null;
  const token = decodeURIComponent(cookie.slice(COOKIE_NAME.length + 1));
  const [encoded, supplied, extra] = token.split(".");
  if (!encoded || !supplied || extra) return null;
  try {
    const expected = signature(encoded);
    const expectedBuffer = Buffer.from(expected);
    const suppliedBuffer = Buffer.from(supplied);
    if (expectedBuffer.length !== suppliedBuffer.length || !timingSafeEqual(expectedBuffer, suppliedBuffer)) return null;
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as ChwSession;
    if (!payload.sub || !payload.county || !payload.role || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    if (payload.role !== "chw" && payload.role !== "county") return null;
    return payload;
  } catch {
    return null;
  }
}

export function attachSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

function scryptBytes(password: string, salt: Buffer, length: number) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, length, (error, derived) => {
      if (error) reject(error);
      else resolve(derived as Buffer);
    });
  });
}

export async function hashPin(pin: string) {
  const salt = randomBytes(16);
  const derived = await scryptBytes(pin, salt, 64);
  return { pinSalt: salt.toString("base64url"), pinHash: derived.toString("base64url") };
}

export async function verifyPin(pin: string, saltText: string, hashText: string) {
  try {
    const salt = Buffer.from(saltText, "base64url");
    const savedHash = Buffer.from(hashText, "base64url");
    const derived = await scryptBytes(pin, salt, savedHash.length);
    return savedHash.length === derived.length && timingSafeEqual(savedHash, derived);
  } catch {
    return false;
  }
}

const accountKey = (id: string) => `raphael:account:${id}`;

export async function getAccount(id: string) {
  return kvGetJson<ChwAccount>(accountKey(id));
}

export async function createAccount(account: ChwAccount) {
  const result = await kvSetJsonIfMissing(accountKey(account.id), account);
  if (result !== "OK") return false;
  await kvSetAdd(`raphael:county:${account.county}:chws`, account.id);
  return true;
}

export { SESSION_TTL_SECONDS };
