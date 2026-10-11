import { NextResponse } from "next/server";
import type { Patient } from "@/lib/types";
import { badRequest, jsonPrivate, safeJson } from "@/lib/server/api";
import { authorisedHealthRequest } from "@/lib/server/health-api";
import { listHealthRecords, upsertHealthRecord } from "@/lib/server/health-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const access = authorisedHealthRequest(request, ["chw"]);
  if (!access.session) return access.response;
  try {
    const records = await listHealthRecords<Patient>(access.session.sub, "patient");
    return jsonPrivate({ records });
  } catch {
    return jsonPrivate({ error: "storage_unavailable", message: "Patient records could not be loaded." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const access = authorisedHealthRequest(request, ["chw"]);
  if (!access.session) return access.response;
  const body = await safeJson(request, 32_000);
  if (!body || typeof body.id !== "string" || typeof body.fullName !== "string" || body.fullName.trim().length < 2) return badRequest("A patient ID and full name are required.");
  const record = { ...body, updatedAt: new Date().toISOString() } as unknown as Patient;
  try {
    await upsertHealthRecord(access.session.sub, "patient", record.id, record);
    return jsonPrivate({ success: true, record }, { status: 201 });
  } catch {
    return jsonPrivate({ error: "storage_unavailable", message: "The patient record was not saved to the county service." }, { status: 503 });
  }
}
