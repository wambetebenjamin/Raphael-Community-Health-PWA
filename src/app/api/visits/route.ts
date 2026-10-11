import type { Visit } from "@/lib/types";
import { badRequest, jsonPrivate, safeJson } from "@/lib/server/api";
import { authorisedHealthRequest } from "@/lib/server/health-api";
import { listHealthRecords, upsertHealthRecord } from "@/lib/server/health-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const access = authorisedHealthRequest(request, ["chw"]);
  if (!access.session) return access.response;
  try {
    const records = await listHealthRecords<Visit>(access.session.sub, "visit");
    return jsonPrivate({ records });
  } catch {
    return jsonPrivate({ error: "storage_unavailable", message: "Visit history could not be loaded." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const access = authorisedHealthRequest(request, ["chw"]);
  if (!access.session) return access.response;
  const body = await safeJson(request, 24_000);
  if (!body || typeof body.id !== "string" || typeof body.patientId !== "string" || typeof body.visitType !== "string") return badRequest("A patient, visit type, and record ID are required.");
  const record = { ...body, createdAt: new Date().toISOString() } as unknown as Visit;
  try {
    await upsertHealthRecord(access.session.sub, "visit", record.id, record);
    return jsonPrivate({ success: true, record }, { status: 201 });
  } catch {
    return jsonPrivate({ error: "storage_unavailable", message: "The visit could not be saved to the county service." }, { status: 503 });
  }
}
