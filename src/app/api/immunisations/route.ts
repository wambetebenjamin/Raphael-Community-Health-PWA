import type { ImmunisationRecord } from "@/lib/types";
import { badRequest, jsonPrivate, safeJson } from "@/lib/server/api";
import { authorisedHealthRequest } from "@/lib/server/health-api";
import { listHealthRecords, upsertHealthRecord } from "@/lib/server/health-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const access = authorisedHealthRequest(request, ["chw"]);
  if (!access.session) return access.response;
  try {
    const records = await listHealthRecords<ImmunisationRecord>(access.session.sub, "immunisation");
    return jsonPrivate({ records });
  } catch {
    return jsonPrivate({ error: "storage_unavailable", message: "Immunisation records could not be loaded." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const access = authorisedHealthRequest(request, ["chw"]);
  if (!access.session) return access.response;
  const body = await safeJson(request, 16_000);
  if (!body || typeof body.id !== "string" || typeof body.patientId !== "string" || typeof body.vaccine !== "string") return badRequest("A patient, vaccine, and record ID are required.");
  const record = { ...body, createdAt: new Date().toISOString() } as unknown as ImmunisationRecord;
  try {
    await upsertHealthRecord(access.session.sub, "immunisation", record.id, record);
    return jsonPrivate({ success: true, record }, { status: 201 });
  } catch {
    return jsonPrivate({ error: "storage_unavailable", message: "The immunisation record was not saved." }, { status: 503 });
  }
}
