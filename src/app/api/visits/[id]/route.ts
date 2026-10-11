import type { Visit } from "@/lib/types";
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
    const record = (await listHealthRecords<Visit>(access.session.sub, "visit")).find((item) => item.id === id);
    return record ? jsonPrivate({ record }) : jsonPrivate({ error: "not_found", message: "Visit record not found." }, { status: 404 });
  } catch {
    return jsonPrivate({ error: "storage_unavailable", message: "Visit details could not be loaded." }, { status: 503 });
  }
}

export async function PUT(request: Request, { params }: Props) {
  const access = authorisedHealthRequest(request, ["chw"]);
  if (!access.session) return access.response;
  const { id } = await params;
  if (!id) return missingId();
  const body = await safeJson(request, 24_000);
  if (!body || typeof body.patientId !== "string" || typeof body.visitType !== "string") return badRequest("A patient and visit type are required.");
  const record = { ...body, id, updatedAt: new Date().toISOString() } as unknown as Visit;
  try {
    await upsertHealthRecord(access.session.sub, "visit", id, record);
    return jsonPrivate({ success: true, record });
  } catch {
    return jsonPrivate({ error: "storage_unavailable", message: "Visit changes could not be saved." }, { status: 503 });
  }
}

export async function PATCH(request: Request, context: Props) { return PUT(request, context); }

export async function DELETE(request: Request, { params }: Props) {
  const access = authorisedHealthRequest(request, ["chw"]);
  if (!access.session) return access.response;
  const { id } = await params;
  if (!id) return missingId();
  try {
    await deleteHealthRecord(access.session.sub, "visit", id);
    return jsonPrivate({ success: true, deletedId: id });
  } catch {
    return jsonPrivate({ error: "storage_unavailable", message: "The visit could not be deleted." }, { status: 503 });
  }
}
