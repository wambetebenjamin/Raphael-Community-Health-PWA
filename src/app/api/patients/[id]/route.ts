import type { Patient } from "@/lib/types";
import { badRequest, jsonPrivate, safeJson } from "@/lib/server/api";
import { authorisedHealthRequest, missingId } from "@/lib/server/health-api";
import { deleteHealthRecord, listHealthRecords, upsertHealthRecord } from "@/lib/server/health-store";

type Props = { params: Promise<{ id: string }> };
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: Props) {
  const access = authorisedHealthRequest(request, ["chw"]);
  if (!access.session) return access.response;
  const { id } = await params;
  if (!id) return missingId();
  try {
    const records = await listHealthRecords<Patient>(access.session.sub, "patient");
    const record = records.find((item) => item.id === id);
    return record ? jsonPrivate({ record }) : jsonPrivate({ error: "not_found", message: "Patient record not found." }, { status: 404 });
  } catch {
    return jsonPrivate({ error: "storage_unavailable", message: "Patient details could not be loaded." }, { status: 503 });
  }
}

export async function PUT(request: Request, { params }: Props) {
  const access = authorisedHealthRequest(request, ["chw"]);
  if (!access.session) return access.response;
  const { id } = await params;
  if (!id) return missingId();
  const body = await safeJson(request, 32_000);
  if (!body || typeof body.fullName !== "string" || body.fullName.trim().length < 2) return badRequest("A patient name is required.");
  const record = { ...body, id, updatedAt: new Date().toISOString() } as unknown as Patient;
  try {
    await upsertHealthRecord(access.session.sub, "patient", id, record);
    return jsonPrivate({ success: true, record });
  } catch {
    return jsonPrivate({ error: "storage_unavailable", message: "Patient changes were not saved to the county service." }, { status: 503 });
  }
}

export async function PATCH(request: Request, context: Props) {
  return PUT(request, context);
}

export async function DELETE(request: Request, { params }: Props) {
  const access = authorisedHealthRequest(request, ["chw"]);
  if (!access.session) return access.response;
  const { id } = await params;
  if (!id) return missingId();
  try {
    await deleteHealthRecord(access.session.sub, "patient", id);
    return jsonPrivate({ success: true, deletedId: id });
  } catch {
    return jsonPrivate({ error: "storage_unavailable", message: "Patient deletion could not be completed." }, { status: 503 });
  }
}
