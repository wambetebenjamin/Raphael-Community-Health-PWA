import "server-only";
import { NextResponse } from "next/server";
import { getSession, type ChwSession } from "@/lib/server/auth";

export const privateJsonHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  Vary: "Cookie",
};

export function jsonPrivate<T>(body: T, init?: { status?: number }) {
  return NextResponse.json(body, { status: init?.status ?? 200, headers: privateJsonHeaders });
}

export function sessionFor(request: Request, roles?: ChwSession["role"][]) {
  const session = getSession(request);
  if (!session) {
    return {
      session: null,
      response: jsonPrivate({ error: "unauthorized", message: "Sign in to your CHW workspace to continue." }, { status: 401 }),
    };
  }
  if (roles && !roles.includes(session.role)) {
    return {
      session: null,
      response: jsonPrivate({ error: "forbidden", message: "This workspace role is not authorised for that data." }, { status: 403 }),
    };
  }
  return { session, response: null };
}

export function serviceUnavailable(message: string) {
  return jsonPrivate({ error: "service_unavailable", message }, { status: 503 });
}

export function badRequest(message: string) {
  return jsonPrivate({ error: "invalid_request", message }, { status: 400 });
}

export async function safeJson(request: Request, maxBytes = 128_000): Promise<Record<string, unknown> | null> {
  try {
    const text = await request.text();
    if (!text || text.length > maxBytes) return null;
    const value = JSON.parse(text) as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    return value as Record<string, unknown>;
  } catch {
    return null;
  }
}
