import "server-only";
import type { ChwSession } from "@/lib/server/auth";
import { sessionFor, serviceUnavailable } from "@/lib/server/api";
import { kvConfigured } from "@/lib/server/kv";
import { healthStorageConfigured } from "@/lib/server/health-store";
import { jsonPrivate } from "@/lib/server/api";

export function authorisedHealthRequest(request: Request, roles?: ChwSession["role"][]) {
  const checked = sessionFor(request, roles);
  if (!checked.session) return { session: null, response: checked.response };
  if (!kvConfigured() || !healthStorageConfigured()) {
    return {
      session: null,
      response: serviceUnavailable("Secure county storage and server-side health data encryption are not configured. Patient data remains on this device."),
    };
  }
  return { session: checked.session, response: null };
}

export function missingId() {
  return jsonPrivate({ error: "invalid_request", message: "A record ID is required." }, { status: 400 });
}
