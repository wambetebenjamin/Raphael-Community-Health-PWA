import type { ImmunisationRecord } from "@/lib/types";
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
    const record = (await listHealthRecords<ImmunisationRecord>(access.session.sub, "immunisation")).find((item) => item.id === id);
    return record ? jsonPrivate({ record }) : jsonPrivate({ error: "not_found", message: "Immunisation record not found." }, { status: 404 });
  } catch {
    return jsonPrivate({ error: "storage_unavailable", message: "Immunisation details could not be loaded." }, { status: 503 });
  }
}

export async function PUT(request: Request, { params }: Props) {
  const access = authorisedHealthRequest(request, ["chw"]);
  if (!access.session) return access.response;
  const { id } = await params;
  if (!id) return missingId();
  const body = await safeJson(request, 16_000);
  if (!body || typeof body.patientId !== "string" || typeof body.vaccine !== "string") return badRequest("A patient and vaccine are required.");
  const record = { ...body, id, updatedAt: new Date().toISOString() } as unknown as ImmunisationRecord;
  try {
    await upsertHealthRecord(access.session.sub, "immunisation", id, record);
    return jsonPrivate({ success: true, record });
  } catch {
    return jsonPrivate({ error: "storage_unavailable", message: "Immunisation changes could not be saved." }, { status: 503 });
  }
}

export async function PATCH(request: Request, context: Props) { return PUT(request, context); }

export async function DELETE(request: Request, { params }: Props) {
  const access = authorisedHealthRequest(request, ["chw"]);
  if (!access.session) return access.response;
  const { id } = await params;
  if (!id) return missingId();
  try {
    await deleteHealthRecord(access.session.sub, "immunisation", id);
    return jsonPrivate({ success: true, deletedId: id });
  } catch {
    return jsonPrivate({ error: "storage_unavailable", message: "The immunisation record could not be deleted." }, { status: 503 });
  }
}
