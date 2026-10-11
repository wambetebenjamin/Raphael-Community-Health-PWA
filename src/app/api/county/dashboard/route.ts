import { authorisedHealthRequest } from "@/lib/server/health-api";
import { jsonPrivate } from "@/lib/server/api";
import { listCountyAccounts } from "@/lib/server/health-store";
import { listHealthRecords } from "@/lib/server/health-store";
import type { CountyName, Patient, Visit, ImmunisationRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const access = authorisedHealthRequest(request, ["county"]);
  if (!access.session) return access.response;
  try {
    const accounts = await listCountyAccounts(access.session.county as CountyName);
    const totals = { chws: accounts.length, patients: 0, visits: 0, immunisations: 0 };
    for (const accountId of accounts) {
      const [patients, visits, immunisations] = await Promise.all([
        listHealthRecords<Patient>(accountId, "patient"),
        listHealthRecords<Visit>(accountId, "visit"),
        listHealthRecords<ImmunisationRecord>(accountId, "immunisation"),
      ]);
      totals.patients += patients.length;
      totals.visits += visits.length;
      totals.immunisations += immunisations.length;
    }
    return jsonPrivate({ county: access.session.county, totals, generatedAt: new Date().toISOString() });
  } catch {
    return jsonPrivate({ error: "storage_unavailable", message: "County aggregate data could not be loaded." }, { status: 503 });
  }
}
