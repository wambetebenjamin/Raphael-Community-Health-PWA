import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { authorisedHealthRequest } from "@/lib/server/health-api";
import { listHealthRecords } from "@/lib/server/health-store";
import type { ImmunisationRecord, Patient, Visit } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const access = authorisedHealthRequest(request, ["chw", "county"]);
  if (!access.session) return access.response;
  try {
    const [patients, visits, immunisations] = await Promise.all([
      listHealthRecords<Patient>(access.session.sub, "patient"),
      listHealthRecords<Visit>(access.session.sub, "visit"),
      listHealthRecords<ImmunisationRecord>(access.session.sub, "immunisation"),
    ]);
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]);
    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const navy = rgb(9 / 255, 30 / 255, 62 / 255);
    const teal = rgb(7 / 255, 83 / 255, 108 / 255);
    page.drawText("Raphael Community Health", { x: 54, y: 777, size: 18, font: bold, color: navy });
    page.drawText("Community health activity report preview", { x: 54, y: 750, size: 12, font: regular, color: teal });
    page.drawText(`County: ${access.session.county}`, { x: 54, y: 704, size: 11, font: regular, color: navy });
    page.drawText(`Generated: ${new Date().toISOString().slice(0, 10)}`, { x: 54, y: 685, size: 11, font: regular, color: navy });
    page.drawText("Aggregate totals", { x: 54, y: 632, size: 14, font: bold, color: navy });
    const rows = [
      ["Patient records", String(patients.length)],
      ["Visit records", String(visits.length)],
      ["Immunisation records", String(immunisations.length)],
      ["Visits in current month", String(visits.filter((visit) => visit.visitedAt?.slice(0, 7) === new Date().toISOString().slice(0, 7)).length)],
    ];
    rows.forEach(([label, value], index) => {
      const y = 596 - index * 29;
      page.drawText(label, { x: 62, y, size: 11, font: regular, color: navy });
      page.drawText(value, { x: 440, y, size: 11, font: bold, color: teal });
      page.drawLine({ start: { x: 54, y: y - 9 }, end: { x: 535, y: y - 9 }, thickness: 0.5, color: rgb(.83, .88, .9) });
    });
    page.drawText("Reporting and compliance note", { x: 54, y: 438, size: 13, font: bold, color: navy });
    const note = [
      "This is an aggregate export preview generated from the signed-in workspace.",
      "Validate data definitions, reporting periods, and layout with the county and Ministry of Health before submission.",
      "This demo does not claim formal MOH, NHIF, or DHIS2 certification or active integration.",
      "Do not share this file outside the authorised county workflow.",
    ];
    note.forEach((line, index) => page.drawText(line, { x: 54, y: 410 - index * 21, size: 10, font: regular, color: navy, maxWidth: 480 }));
    page.drawText("Private health data. Handle and store in accordance with county instructions.", { x: 54, y: 70, size: 9, font: regular, color: teal });
    const bytes = await pdf.save();
    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="raphael-moh-report-preview.pdf"',
        "Cache-Control": "private, no-store, max-age=0",
        Vary: "Cookie",
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: "report_unavailable", message: "The MOH report could not be generated." }), {
      status: 503,
      headers: { "Content-Type": "application/json", "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie" },
    });
  }
}
