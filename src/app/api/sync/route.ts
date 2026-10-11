import { jsonPrivate, safeJson } from "@/lib/server/api";
import { authorisedHealthRequest } from "@/lib/server/health-api";
import { deleteHealthRecord, upsertHealthRecord } from "@/lib/server/health-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const access = authorisedHealthRequest(request, ["chw"]);
  if (!access.session) return access.response;
  const body = await safeJson(request, 512_000);
  const records = body?.records;
  if (!Array.isArray(records) || records.length < 1 || records.length > 100) {
    return jsonPrivate({ error: "invalid_request", message: "Submit between one and 100 queued records." }, { status: 400 });
  }
  const confirmedIds: string[] = [];
  try {
    for (const entry of records) {
      if (!entry || typeof entry !== "object") continue;
      const record = entry as Record<string, unknown>;
      const queueId = typeof record.queueId === "string" ? record.queueId : "";
      const kind = record.kind;
      const operation = record.operation;
      const payload = record.payload;
      if (!queueId || !["patient", "visit", "immunisation"].includes(String(kind))) continue;
      const healthKind = kind as "patient" | "visit" | "immunisation";
      const data = payload && typeof payload === "object" ? payload as Record<string, unknown> : null;
      if (!data || typeof data.id !== "string" || data.id.length > 100) continue;
      if (operation === "delete") {
        await deleteHealthRecord(access.session.sub, healthKind, data.id);
      } else if (operation === "upsert") {
        await upsertHealthRecord(access.session.sub, healthKind, data.id, data);
      } else {
        continue;
      }
      confirmedIds.push(queueId);
    }
  } catch {
    return jsonPrivate({ error: "partial_sync", message: "Some records could not be confirmed. Unconfirmed records remain in the local queue.", confirmedIds }, { status: 503 });
  }
  return jsonPrivate({
    success: true,
    confirmedIds,
    syncedAt: new Date().toISOString(),
    message: `${confirmedIds.length} record${confirmedIds.length === 1 ? "" : "s"} confirmed by the county service.`,
  });
}
