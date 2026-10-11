"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  CircleCheck,
  Clock3,
  CloudOff,
  CloudUpload,
  Download,
  FileText,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  UserRound,
  Wifi,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChwProfile, ImmunisationRecord, Patient, SyncLogEntry, Visit } from "@/lib/types";
import { getAppSetting, hasLocalPin, queuePublicSubmission, setAppSetting, setLocalPin, verifyLocalPin } from "@/lib/offline-db";
import { usePublicForm } from "@/components/use-public-form";

const todayInKenya = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Nairobi", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const formatDate = (value?: string) => value ? new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Nairobi" }).format(new Date(value)) : "Not recorded";
const formatTime = (value?: string) => value ? new Intl.DateTimeFormat("en-KE", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Nairobi" }).format(new Date(value)) : "Any time";
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "CH";
const ageInYears = (value: string) => Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / (365.2425 * 24 * 60 * 60 * 1000)));

export function HomeView({
  profile,
  patients,
  visits,
  pendingCount,
  online,
  lastSynced,
  onTab,
  onNewPatient,
  onNewVisit,
  onSync,
}: {
  profile: ChwProfile;
  patients: Patient[];
  visits: Visit[];
  pendingCount: number;
  online: boolean;
  lastSynced: string;
  onTab: (tab: "home" | "patients" | "visits" | "sync" | "settings") => void;
  onNewPatient: () => void;
  onNewVisit: () => void;
  onSync: () => void;
}) {
  const today = todayInKenya();
  const completedToday = visits.filter((visit) => visit.visitedAt.slice(0, 10) === today).length;
  const duePatients = patients.filter((patient) => patient.followUpDue && patient.followUpDue <= today);
  const upcomingPatients = [...patients].filter((patient) => patient.followUpDue).sort((a, b) => (a.followUpDue ?? "").localeCompare(b.followUpDue ?? "")).slice(0, 4);
  const recentVisits = [...visits].sort((a, b) => b.visitedAt.localeCompare(a.visitedAt)).slice(0, 4);
  const visitPatient = (id: string) => patients.find((patient) => patient.id === id);
  return (
    <>
      <div className="app-heading-row">
        <div><h1>Good day, {profile.fullName.split(" ")[0]}</h1><p>{new Intl.DateTimeFormat("en-KE", { weekday: "long", day: "numeric", month: "long", timeZone: "Africa/Nairobi" }).format(new Date())} · {profile.ward || "Field workspace"}, {profile.county}</p></div>
        <div className="app-heading-actions"><button className="btn btn-outline" type="button" onClick={onSync}><CloudUpload /> Sync Now</button><button className="btn btn-primary" type="button" onClick={onNewVisit}><Plus /> Record Visit</button></div>
      </div>
      {profile.demo && <div className="demo-mode-note"><AlertCircle /><span><strong>Training workspace</strong>Sample patient details are fictional and stored only on this device. Sign in to sync approved records with a county service.</span></div>}
      <div className="stats-grid">
        <Stat label="Visits planned today" value="8" foot="Across your assigned households" icon={<CalendarDays />} />
        <Stat label="Visits completed" value={String(completedToday)} foot="Saved in today’s visit log" icon={<CircleCheck />} />
        <Stat label="Follow-ups due" value={String(duePatients.length)} foot={duePatients.length ? "Review dates before your next round" : "No follow-ups overdue"} icon={<Clock3 />} alert={duePatients.length > 0} />
        <Stat label="Pending sync" value={String(pendingCount)} foot={online ? pendingCount ? "Waiting for secure account sync" : "All local changes are saved" : "Changes stay on this device"} icon={online ? <CloudUpload /> : <CloudOff />} alert={pendingCount > 0} />
      </div>
      <div className="dashboard-grid">
        <section className="panel" aria-labelledby="today-visits-heading">
          <div className="panel-heading"><div><h2 id="today-visits-heading">Recent field visits</h2><p>Visit history stored on this device</p></div><button className="text-link" type="button" onClick={() => onTab("visits")}>All visits <ChevronRight /></button></div>
          {recentVisits.length ? <div className="visit-list">{recentVisits.map((visit) => {
            const patient = visitPatient(visit.patientId);
            return <div className="visit-list-item" key={visit.id}><span className="visit-time">{formatTime(visit.visitedAt)}</span><span><strong>{patient?.fullName ?? "Patient record"}</strong><small>{visit.visitType} · {visit.chiefComplaint || "Community follow-up"}</small></span><span className="status-badge"><Check size={13} /> Saved</span></div>;
          })}</div> : <div className="empty-state"><CalendarDays /><div><strong>No visits saved yet</strong><p>Record a visit to start today’s activity log.</p></div></div>}
        </section>
        <section className="panel" aria-labelledby="quick-actions-heading">
          <div className="panel-heading"><div><h2 id="quick-actions-heading">Quick actions</h2><p>Keep the field workflow moving</p></div></div>
          <div className="quick-actions">
            <button className="quick-action" type="button" onClick={onNewPatient}><span className="icon-box"><Plus /></span><span><strong>New patient</strong><span>Save a household profile</span></span></button>
            <button className="quick-action" type="button" onClick={onNewVisit}><span className="icon-box"><FileText /></span><span><strong>Record a visit</strong><span>Capture observations and actions</span></span></button>
            <button className="quick-action" type="button" onClick={() => onTab("sync")}><span className="icon-box"><CloudUpload /></span><span><strong>Check sync status</strong><span>{pendingCount ? `${pendingCount} item${pendingCount === 1 ? "" : "s"} waiting` : lastSynced}</span></span></button>
          </div>
        </section>
      </div>
      <section className="panel section-panel" aria-labelledby="followups-heading">
        <div className="panel-heading"><div><h2 id="followups-heading">Follow-up list</h2><p>Use local records to prepare your next household round</p></div><button className="text-link" type="button" onClick={() => onTab("patients")}>Open patients <ChevronRight /></button></div>
        {upcomingPatients.length ? <div className="followup-list">{upcomingPatients.map((patient) => <div className="followup-item" key={patient.id}><div><strong>{patient.fullName}</strong><span>{patient.village} · {patient.id}</span></div><span className={`status-badge${patient.followUpDue && patient.followUpDue <= today ? " is-due" : " is-neutral"}`}>{patient.followUpDue && patient.followUpDue <= today ? "Due" : `Due ${formatDate(patient.followUpDue)}`}</span></div>)}</div> : <div className="empty-state"><UserRound /><div><strong>No patient records yet</strong><p>Add a patient to start a local follow-up list.</p></div></div>}
      </section>
    </>
  );
}

function Stat({ label, value, foot, icon, alert = false }: { label: string; value: string; foot: string; icon: ReactNode; alert?: boolean }) {
  return <article className="stat-card"><div className="stat-top"><span className="stat-label">{label}</span><span className="icon-box">{icon}</span></div><strong className="stat-value">{value}</strong><span className="stat-foot">{alert ? <AlertCircle /> : <Check />} {foot}</span></article>;
}

export function PatientsView({
  patients,
  visits,
  onNewPatient,
  onOpenPatient,
}: {
  patients: Patient[];
  visits: Visit[];
  onNewPatient: () => void;
  onOpenPatient: (patient: Patient) => void;
}) {
  const [query, setQuery] = useState("");
  const lastVisit = useMemo(() => {
    const map = new Map<string, string>();
    for (const visit of visits) if (!map.has(visit.patientId) || visit.visitedAt > (map.get(visit.patientId) ?? "")) map.set(visit.patientId, visit.visitedAt);
    return map;
  }, [visits]);
  const filtered = patients.filter((patient) => `${patient.fullName} ${patient.id} ${patient.village} ${patient.householdNumber}`.toLowerCase().includes(query.toLowerCase()));
  const today = todayInKenya();
  return (
    <>
      <div className="app-heading-row"><div><h1>Patients</h1><p>Search saved records on this device, even offline.</p></div><div className="app-heading-actions"><button className="btn btn-primary" type="button" onClick={onNewPatient}><Plus /> New Patient</button></div></div>
      <section className="panel section-panel">
        <div className="search-row"><label className="search-input"><Search /><span className="sr-only">Search patients by name, ID, or village</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by patient name, ID, village" /></label><span className="status-badge is-neutral">{filtered.length} records</span></div>
        {patients.some((patient) => patient.sample) && <p className="metadata">Training sample records are fictional. Do not treat them as real patient histories.</p>}
        {filtered.length ? <div className="patient-list">{filtered.map((patient) => <article className="patient-row" key={patient.id}>
          <div className="patient-main"><span className="patient-avatar">{initials(patient.fullName)}</span><span><strong>{patient.fullName}</strong><small>{patient.id} · {patient.village}</small></span></div>
          <div className="patient-meta">Last visit<small>{lastVisit.has(patient.id) ? formatDate(lastVisit.get(patient.id)) : "No visit recorded"}</small></div>
          <div className="patient-meta">Follow-up<small>{patient.followUpDue ? formatDate(patient.followUpDue) : "Not scheduled"}</small></div>
          {patient.followUpDue && <span className={`status-badge${patient.followUpDue <= today ? " is-due" : " is-neutral"}`}>{patient.followUpDue <= today ? "Due" : "Upcoming"}</span>}
          <button type="button" onClick={() => onOpenPatient(patient)}>Open profile <ChevronRight size={14} /></button>
        </article>)}</div> : <div className="empty-state"><Search /><div><strong>{query ? "No matching patients" : "No patient records yet"}</strong><p>{query ? "Try a name, ID, or village." : "Create the first patient record to keep a local visit history."}</p></div></div>}
      </section>
    </>
  );
}

export function VisitsView({ patients, visits, onNewVisit }: { patients: Patient[]; visits: Visit[]; onNewVisit: () => void }) {
  const sorted = [...visits].sort((a, b) => b.visitedAt.localeCompare(a.visitedAt));
  const byId = new Map(patients.map((patient) => [patient.id, patient]));
  return (
    <>
      <div className="app-heading-row"><div><h1>Field visits</h1><p>Record routine, follow-up, emergency, ANC, or postnatal contacts.</p></div><div className="app-heading-actions"><button className="btn btn-primary" type="button" onClick={onNewVisit}><Plus /> Record Visit</button></div></div>
      <section className="panel section-panel"><div className="panel-heading"><div><h2>Visit history</h2><p>{visits.length} records stored locally</p></div><span className="status-badge is-neutral"><CloudOff size={13} /> Local first</span></div>
        {sorted.length ? <div className="visit-list">{sorted.map((visit) => <div className="visit-list-item" key={visit.id}><span className="visit-time">{formatDate(visit.visitedAt)}</span><span><strong>{byId.get(visit.patientId)?.fullName ?? visit.patientId}</strong><small>{visit.visitType} · {visit.chiefComplaint || "No complaint entered"}</small></span><span className="status-badge is-neutral">{visit.referral ? "Referral" : "Saved"}</span></div>)}</div> : <div className="empty-state"><FileText /><div><strong>No visit records yet</strong><p>Use Record Visit to create a local field entry.</p></div></div>}
      </section>
    </>
  );
}

export function PatientEditor({ profile, onSave, onCancel }: { profile: ChwProfile; onSave: (patient: Patient) => Promise<void>; onCancel: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    const now = new Date().toISOString();
    const patient: Patient = {
      id: `RCH-${Date.now().toString().slice(-7)}`,
      fullName: String(form.get("fullName") ?? "").trim(),
      dateOfBirth: String(form.get("dateOfBirth") ?? ""),
      gender: String(form.get("gender") ?? "undisclosed") as Patient["gender"],
      village: String(form.get("village") ?? "").trim(),
      householdNumber: String(form.get("householdNumber") ?? "").trim(),
      nextOfKinName: String(form.get("nextOfKinName") ?? "").trim(),
      nextOfKinPhone: String(form.get("nextOfKinPhone") ?? "").trim(),
      chronicConditions: String(form.get("chronicConditions") ?? "").split(",").map((item) => item.trim()).filter(Boolean),
      county: profile.county,
      subCounty: profile.subCounty,
      ward: profile.ward,
      followUpDue: String(form.get("followUpDue") ?? "") || undefined,
      createdAt: now,
      updatedAt: now,
    };
    try { await onSave(patient); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "The patient record could not be saved."); }
    finally { setBusy(false); }
  };
  return <section className="app-form-card" aria-labelledby="new-patient-title"><h2 id="new-patient-title">Add a patient</h2><p>Saved on this device first. Patient details are encrypted in local IndexedDB.</p>
    <form onSubmit={submit}>
      <div className="app-form-grid">
        <div className="form-field"><label htmlFor="patient-name">Full name</label><input id="patient-name" name="fullName" required autoComplete="name" maxLength={120} /></div>
        <div className="form-field"><label htmlFor="patient-dob">Date of birth</label><input id="patient-dob" name="dateOfBirth" type="date" required max={todayInKenya()} /></div>
        <div className="form-field"><label htmlFor="patient-gender">Gender</label><select id="patient-gender" name="gender" required defaultValue="undisclosed"><option value="undisclosed">Prefer not to say</option><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option></select></div>
        <div className="form-field"><label htmlFor="patient-village">Village</label><input id="patient-village" name="village" required maxLength={100} /></div>
        <div className="form-field"><label htmlFor="patient-household">Household number</label><input id="patient-household" name="householdNumber" maxLength={40} /></div>
        <div className="form-field"><label htmlFor="patient-next-of-kin">Next of kin name</label><input id="patient-next-of-kin" name="nextOfKinName" maxLength={120} /></div>
        <div className="form-field"><label htmlFor="patient-next-of-kin-phone">Next of kin phone</label><input id="patient-next-of-kin-phone" name="nextOfKinPhone" type="tel" maxLength={24} /></div>
        <div className="form-field"><label htmlFor="patient-follow-up">Next follow-up</label><input id="patient-follow-up" name="followUpDue" type="date" /></div>
        <div className="form-field form-field--full"><label htmlFor="patient-conditions">Chronic conditions</label><input id="patient-conditions" name="chronicConditions" placeholder="Separate conditions with commas" maxLength={400} /></div>
      </div>
      {error && <p className="form-message is-error" role="alert">{error}</p>}
      <div className="app-form-actions"><button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "Saving..." : "Save patient"}</button><button className="btn btn-outline" type="button" onClick={onCancel}>Cancel</button><span className="inline-help"><ShieldCheck /> Encrypted local storage</span></div>
    </form>
  </section>;
}

export function VisitEditor({ patients, onSave, onCancel }: { patients: Patient[]; onSave: (visit: Visit) => Promise<void>; onCancel: () => void }) {
  const [busy, setBusy] = useState(false);
  const [patientQuery, setPatientQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [gps, setGps] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gpsMessage, setGpsMessage] = useState("Trying to capture your location...");
  const [gpsError, setGpsError] = useState(false);
  const [referral, setReferral] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!navigator.geolocation) { setGpsMessage("Location is unavailable. You can enter coordinates manually."); setGpsError(true); return; }
    navigator.geolocation.getCurrentPosition(
      (position) => { setGps({ latitude: position.coords.latitude, longitude: position.coords.longitude }); setGpsMessage("Location captured with permission."); setGpsError(false); },
      () => { setGpsMessage("Location was not shared. A manual location is optional."); setGpsError(true); },
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 60_000 },
    );
  }, []);

  const choosePatient = (value: string) => {
    setPatientQuery(value);
    const normalized = value.trim().toLowerCase();
    const found = patients.find((patient) => patient.id.toLowerCase() === normalized || patient.fullName.toLowerCase() === normalized);
    setSelectedId(found?.id ?? "");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (!selectedId) { setError("Choose a patient from your offline patient list."); return; }
    setBusy(true);
    setError("");
    const parseNumber = (name: string) => {
      const raw = String(form.get(name) ?? "").trim();
      return raw ? Number(raw) : undefined;
    };
    const now = new Date().toISOString();
    const visit: Visit = {
      id: `VIS-${Date.now().toString().slice(-8)}`,
      patientId: selectedId,
      visitedAt: now,
      visitType: String(form.get("visitType") ?? "routine") as Visit["visitType"],
      temperature: parseNumber("temperature"),
      weightKg: parseNumber("weightKg"),
      bloodPressure: String(form.get("bloodPressure") ?? "").trim() || undefined,
      chiefComplaint: String(form.get("chiefComplaint") ?? "").trim(),
      interventions: String(form.get("interventions") ?? "").trim(),
      referral,
      referralFacility: referral ? String(form.get("referralFacility") ?? "").trim() : undefined,
      latitude: gps?.latitude ?? parseNumber("latitude"),
      longitude: gps?.longitude ?? parseNumber("longitude"),
      createdAt: now,
    };
    try { await onSave(visit); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "The visit could not be saved."); }
    finally { setBusy(false); }
  };

  return <section className="app-form-card" aria-labelledby="record-visit-title"><h2 id="record-visit-title">Record a field visit</h2><p>Choose a patient from the local list. Your visit saves even without internet.</p>
    <form onSubmit={submit}>
      <div className="app-form-grid">
        <div className="form-field form-field--full"><label htmlFor="visit-patient">Patient selector</label><input id="visit-patient" list="visit-patient-options" value={patientQuery} onChange={(event) => choosePatient(event.target.value)} placeholder="Search by patient name or ID" required /><datalist id="visit-patient-options">{patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.fullName} · {patient.village}</option>)}</datalist><span className="metadata">Searches the patient records saved on this device.</span></div>
        <div className="form-field"><label htmlFor="visit-type">Visit type</label><select id="visit-type" name="visitType" defaultValue="routine"><option value="routine">Routine</option><option value="follow-up">Follow-up</option><option value="emergency">Emergency</option><option value="postnatal">Postnatal</option><option value="ANC">ANC</option></select></div>
        <div className="form-field"><label htmlFor="visit-temperature">Temperature (°C)</label><input id="visit-temperature" name="temperature" type="number" step="0.1" min="30" max="45" placeholder="Optional" /></div>
        <div className="form-field"><label htmlFor="visit-weight">Weight (kg)</label><input id="visit-weight" name="weightKg" type="number" step="0.1" min="0" max="300" placeholder="Optional" /></div>
        <div className="form-field"><label htmlFor="visit-pressure">Blood pressure</label><input id="visit-pressure" name="bloodPressure" placeholder="Optional, for example 110/70" /></div>
        <div className="form-field form-field--full"><label htmlFor="visit-complaint">Chief complaint or reason for visit</label><textarea id="visit-complaint" name="chiefComplaint" maxLength={700} placeholder="Brief field note" /></div>
        <div className="form-field form-field--full"><label htmlFor="visit-interventions">Interventions completed</label><textarea id="visit-interventions" name="interventions" maxLength={900} placeholder="Counselling, screening, follow-up plan" /></div>
        <div className="form-field form-field--full">
          <div className="setting-line" style={{ paddingTop: 5 }}><div><strong>Referral required</strong><span>Show the facility field when a referral is needed.</span></div><button className="switch-control" type="button" role="switch" aria-checked={referral} aria-label="Referral required" onClick={() => setReferral(!referral)} /></div>
        </div>
        {referral && <div className="form-field form-field--full"><label htmlFor="visit-facility">Referral facility</label><input id="visit-facility" name="referralFacility" required maxLength={160} placeholder="Facility or dispensary" /></div>}
        <div className="form-field form-field--full">
          <div className="gps-card"><span className="icon-box"><MapPin /></span><div><strong>Visit location</strong><span className={gpsError ? "gps-message is-muted" : "gps-message"}>{gpsMessage}</span>{gps && <span className="metadata">{gps.latitude.toFixed(5)}, {gps.longitude.toFixed(5)}</span>}</div><button className="btn btn-outline btn-small" type="button" onClick={() => navigator.geolocation?.getCurrentPosition((position) => { setGps({ latitude: position.coords.latitude, longitude: position.coords.longitude }); setGpsMessage("Location captured with permission."); setGpsError(false); }, () => { setGpsMessage("Location permission is unavailable. Enter manually if needed."); setGpsError(true); })}>Capture GPS</button></div>
        </div>
        {gpsError && <><div className="form-field"><label htmlFor="visit-latitude">Latitude, optional</label><input id="visit-latitude" name="latitude" type="number" step="any" placeholder="Manual fallback" /></div><div className="form-field"><label htmlFor="visit-longitude">Longitude, optional</label><input id="visit-longitude" name="longitude" type="number" step="any" placeholder="Manual fallback" /></div></>}
      </div>
      {error && <p className="form-message is-error" role="alert">{error}</p>}
      <div className="app-form-actions"><button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "Saving..." : "Save visit"}</button><button className="btn btn-outline" type="button" onClick={onCancel}>Cancel</button><span className="inline-help"><CloudOff /> Saved locally before sync</span></div>
    </form>
  </section>;
}

const vaccineSchedule = [
  { vaccine: "BCG", dose: "Birth dose", days: 0 },
  { vaccine: "OPV 0", dose: "Birth dose", days: 0 },
  { vaccine: "Pentavalent 1", dose: "Dose 1", days: 42 },
  { vaccine: "OPV 1", dose: "Dose 1", days: 42 },
  { vaccine: "PCV 1", dose: "Dose 1", days: 42 },
  { vaccine: "Rotavirus 1", dose: "Dose 1", days: 42 },
  { vaccine: "Pentavalent 2", dose: "Dose 2", days: 70 },
  { vaccine: "OPV 2", dose: "Dose 2", days: 70 },
  { vaccine: "PCV 2", dose: "Dose 2", days: 70 },
  { vaccine: "Rotavirus 2", dose: "Dose 2", days: 70 },
  { vaccine: "Pentavalent 3", dose: "Dose 3", days: 98 },
  { vaccine: "OPV 3", dose: "Dose 3", days: 98 },
  { vaccine: "Measles-Rubella 1", dose: "Dose 1", days: 270 },
];

export function PatientDetailModal({ patient, visits, immunisations, onClose, onMarkVaccine }: {
  patient: Patient;
  visits: Visit[];
  immunisations: ImmunisationRecord[];
  onClose: () => void;
  onMarkVaccine: (record: ImmunisationRecord) => Promise<void>;
}) {
  const [detailTab, setDetailTab] = useState<"overview" | "immunisation">("overview");
  const [busyVaccine, setBusyVaccine] = useState("");
  const [message, setMessage] = useState("");
  const relatedVisits = visits.filter((visit) => visit.patientId === patient.id).sort((a, b) => b.visitedAt.localeCompare(a.visitedAt));
  const relatedVaccines = immunisations.filter((record) => record.patientId === patient.id);
  const child = ageInYears(patient.dateOfBirth) < 5;
  const growthData = [
    { month: "Birth", kg: 3.1 }, { month: "6 wk", kg: 4.7 }, { month: "10 wk", kg: 5.5 },
    { month: "14 wk", kg: 6.2 }, { month: "6 mo", kg: 7.1 }, { month: "9 mo", kg: 7.8 },
  ];
  const mark = async (vaccine: string, dose: string, dueDate: string) => {
    setBusyVaccine(vaccine);
    setMessage("");
    try {
      await onMarkVaccine({
        id: `IMM-${Date.now().toString().slice(-8)}`,
        patientId: patient.id,
        vaccine,
        dose,
        dateGiven: todayInKenya(),
        dueDate,
        status: "given",
        createdAt: new Date().toISOString(),
      });
      setMessage(`${vaccine} saved on this device.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "The vaccine record could not be saved."); }
    finally { setBusyVaccine(""); }
  };
  const schedule = vaccineSchedule.map((item) => {
    const dueDate = new Date(new Date(patient.dateOfBirth).getTime() + item.days * 86_400_000).toISOString().slice(0, 10);
    const saved = relatedVaccines.find((record) => record.vaccine === item.vaccine && record.status === "given");
    const status = saved ? "given" : dueDate < todayInKenya() ? "overdue" : "due";
    return { ...item, dueDate, status, saved };
  });

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="patient-detail-title">
      <div className="modal-header"><div><span className="eyebrow">Patient profile · {patient.id}</span><h2 id="patient-detail-title">Patient record</h2></div><button className="icon-button" type="button" aria-label="Close patient profile" onClick={onClose}>×</button></div>
      <div className="detail-profile"><div className="detail-ident"><span className="patient-avatar">{initials(patient.fullName)}</span><span><h3>{patient.fullName}</h3><p>{ageInYears(patient.dateOfBirth)} years · {patient.gender} · {patient.village}</p></span></div><span className="status-badge is-neutral"><ShieldCheck size={13} /> Local record</span></div>
      <div className="detail-fields">
        <div className="detail-field"><span>Date of birth</span><strong>{formatDate(patient.dateOfBirth)}</strong></div>
        <div className="detail-field"><span>Household</span><strong>{patient.householdNumber || "Not recorded"}</strong></div>
        <div className="detail-field"><span>Next of kin</span><strong>{patient.nextOfKinName || "Not recorded"}</strong></div>
        <div className="detail-field"><span>Follow-up due</span><strong>{formatDate(patient.followUpDue)}</strong></div>
        <div className="detail-field"><span>Community</span><strong>{patient.ward || patient.subCounty || patient.county}</strong></div>
        <div className="detail-field"><span>Chronic conditions</span><strong>{patient.chronicConditions.length ? patient.chronicConditions.join(", ") : "None recorded"}</strong></div>
      </div>
      <div className="detail-tabs" role="tablist" aria-label="Patient detail sections">
        <button type="button" role="tab" aria-selected={detailTab === "overview"} onClick={() => setDetailTab("overview")}>Overview and visits</button>
        <button type="button" role="tab" aria-selected={detailTab === "immunisation"} onClick={() => setDetailTab("immunisation")}>Immunisation</button>
      </div>
      {detailTab === "overview" ? <div role="tabpanel">
        {child && <><div className="panel-heading"><div><h2>Child growth chart</h2><p>Illustrative trend only. Confirm measurements and interpretation locally.</p></div></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><LineChart data={growthData} margin={{ top: 7, right: 12, left: -13, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#DFE8EC" /><XAxis dataKey="month" tick={{ fontSize: 11, fill: "#526477" }} /><YAxis unit=" kg" tick={{ fontSize: 11, fill: "#526477" }} /><Tooltip formatter={(value) => [`${value} kg`, "Recorded weight"]} /><Line type="monotone" dataKey="kg" stroke="#07536C" strokeWidth={3} dot={{ r: 4, fill: "#06A3DA" }} /></LineChart></ResponsiveContainer></div></>}
        <div className="panel-heading" style={{ marginTop: 20 }}><div><h2>Visit history</h2><p>{relatedVisits.length} visit records</p></div></div>
        {relatedVisits.length ? <div className="visit-list">{relatedVisits.map((visit) => <div className="visit-list-item" key={visit.id}><span className="visit-time">{formatDate(visit.visitedAt)}</span><span><strong>{visit.visitType}</strong><small>{visit.chiefComplaint || visit.interventions || "No note entered"}</small></span><span className="status-badge is-neutral">{visit.referral ? "Referred" : "Saved"}</span></div>)}</div> : <p className="metadata">No visits have been saved for this patient.</p>}
      </div> : <div role="tabpanel">
        <p className="metadata" style={{ marginBottom: 12 }}>The sample schedule is preloaded for demonstration. Confirm the current Kenya EPI schedule with county guidance before clinical use.</p>
        <div className="vaccine-list">{schedule.map((item) => <div className="vaccine-row" key={item.vaccine}><div><strong>{item.vaccine} · {item.dose}</strong><small>{item.status === "given" ? `Given ${formatDate(item.saved?.dateGiven)}` : `${item.status === "overdue" ? "Overdue" : "Next due"} ${formatDate(item.dueDate)}`}</small></div>{item.status === "given" ? <span className="status-badge"><Check size={13} /> Given</span> : <button className="btn btn-outline btn-small" type="button" disabled={Boolean(busyVaccine)} onClick={() => void mark(item.vaccine, item.dose, item.dueDate)}>{busyVaccine === item.vaccine ? "Saving..." : "Mark given"}</button>}</div>)}</div>
        {message && <p className="form-message" role="status">{message}</p>}
      </div>}
    </section>
  </div>;
}

export function SyncView({ online, queueCount, logs, lastSynced, authenticated, syncing, syncMessage, onSync }: {
  online: boolean;
  queueCount: number;
  logs: SyncLogEntry[];
  lastSynced: string;
  authenticated: boolean;
  syncing: boolean;
  syncMessage: string;
  onSync: () => void;
}) {
  return <>
    <div className="app-heading-row"><div><h1>Sync status</h1><p>Review queued field records and the latest sync confirmations.</p></div><div className="app-heading-actions"><button className="btn btn-primary" type="button" onClick={onSync} disabled={syncing}>{syncing ? "Syncing..." : <><CloudUpload /> Sync Now</>}</button></div></div>
    <div className="sync-summary">
      <div className="sync-tile"><span>Connection</span><strong>{online ? "Online" : "Offline"}</strong></div>
      <div className="sync-tile"><span>Pending records</span><strong>{queueCount}</strong></div>
      <div className="sync-tile"><span>Last confirmed sync</span><strong className="sync-date">{lastSynced}</strong></div>
    </div>
    {!authenticated && queueCount > 0 && <div className="demo-mode-note" style={{ marginTop: 14 }}><ShieldCheck /><span><strong>Secure account required</strong>Patient data remains encrypted on this device. Sign in to send it to your authorised county service.</span></div>}
    {syncMessage && <p className="form-message" role="status">{syncMessage}</p>}
    <section className="panel section-panel"><div className="panel-heading"><div><h2>Recent sync log</h2><p>Latest 20 events saved locally</p></div><span className={`status-badge${online ? "" : " is-due"}`}>{online ? <Wifi size={13} /> : <CloudOff size={13} />} {online ? "Connected" : "Offline"}</span></div>
      {logs.length ? <div className="sync-history">{logs.map((log) => <div className={`sync-history-row${log.status === "failed" ? " is-failed" : log.status === "info" ? " is-info" : ""}`} key={log.id}><span className="history-icon">{log.status === "success" ? <Check /> : log.status === "failed" ? <AlertCircle /> : <CloudUpload />}</span><span><strong>{log.message}</strong><small>{formatDate(log.createdAt)} at {formatTime(log.createdAt)}{typeof log.count === "number" ? ` · ${log.count} record${log.count === 1 ? "" : "s"}` : ""}</small></span></div>)}</div> : <div className="empty-state"><CloudUpload /><div><strong>No sync events yet</strong><p>Saved changes will appear here after you sync.</p></div></div>}
    </section>
  </>;
}

export function SettingsView({ profile, online, authenticated, onSaveProfile, onExport, onExportMoh, onLogout }: {
  profile: ChwProfile;
  online: boolean;
  authenticated: boolean;
  onSaveProfile: (profile: ChwProfile) => Promise<void>;
  onExport: () => Promise<void>;
  onExportMoh: () => Promise<void>;
  onLogout: () => Promise<void>;
}) {
  const [smsReminders, setSmsReminders] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [pinMessage, setPinMessage] = useState("");
  const [pinBusy, setPinBusy] = useState(false);
  const [pinExists, setPinExists] = useState(false);
  const reportForm = usePublicForm("contact");
  const [reportEmail, setReportEmail] = useState(profile.email ?? "");
  const [reportMessage, setReportMessage] = useState("");
  const [reportSent, setReportSent] = useState(false);

  useEffect(() => {
    void getAppSetting<boolean>("sms-reminders").then((value) => setSmsReminders(Boolean(value)));
    void hasLocalPin().then(setPinExists);
  }, []);
  useEffect(() => { if (!reportEmail && profile.email) setReportEmail(profile.email); }, [profile.email, reportEmail]);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next: ChwProfile = {
      ...profile,
      fullName: String(form.get("fullName") ?? "").trim(),
      chwId: String(form.get("chwId") ?? "").trim().toUpperCase(),
      county: String(form.get("county") ?? profile.county) as ChwProfile["county"],
      subCounty: String(form.get("subCounty") ?? "").trim(),
      ward: String(form.get("ward") ?? "").trim(),
    };
    try { await onSaveProfile(next); setProfileMessage("CHW profile saved on this device."); }
    catch (error) { setProfileMessage(error instanceof Error ? error.message : "Profile could not be saved."); }
  };

  const savePin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const current = String(form.get("currentPin") ?? "");
    const next = String(form.get("newPin") ?? "");
    const confirm = String(form.get("confirmPin") ?? "");
    setPinMessage("");
    if (pinExists && !(await verifyLocalPin(current))) { setPinMessage("Your current PIN was not recognised."); return; }
    if (next.length < 6 || next.length > 12) { setPinMessage("Choose a PIN between 6 and 12 characters."); return; }
    if (next !== confirm) { setPinMessage("The new PINs do not match."); return; }
    setPinBusy(true);
    try { await setLocalPin(next); setPinExists(true); setPinMessage("Your local app PIN has been updated."); (event.currentTarget as HTMLFormElement).reset(); }
    catch { setPinMessage("The PIN could not be saved on this device."); }
    finally { setPinBusy(false); }
  };

  const submitProblem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = { name: profile.fullName, email: reportEmail, message: reportMessage, consent: true };
    if (!navigator.onLine) {
      try {
        await queuePublicSubmission("problem", "/api/contact", values);
        reportForm.showOfflineMessage("Problem report saved locally. It will be sent after you reconnect and complete the online security check.");
        setReportSent(true);
      } catch (error) { reportForm.setFeedback({ kind: "error", text: error instanceof Error ? error.message : "The report could not be saved." }); }
      return;
    }
    const result = await reportForm.submitOnline("/api/contact", values);
    if (result) { setReportMessage(""); setReportSent(true); }
  };

  return <>
    <div className="app-heading-row"><div><h1>Settings</h1><p>Manage your local CHW details, reminders, and data exports.</p></div><div className="app-heading-actions"><a className="btn btn-outline" href="https://wa.me/254112272061?text=Hello%2C%20I%20need%20help%20with%20Raphael%20Community%20Health." target="_blank" rel="noreferrer">Help and support <ArrowRight /></a></div></div>
    <div className="settings-grid">
      <section className="panel">
        <div className="panel-heading"><div><h2>CHW profile</h2><p>Saved to this device</p></div><span className="status-badge is-neutral">{authenticated ? "Signed in" : "Local profile"}</span></div>
        <form onSubmit={saveProfile}>
          <div className="settings-profile"><span className="profile-avatar">{initials(profile.fullName)}</span><span><strong>{profile.fullName}</strong><span>{profile.chwId} · {profile.county}</span></span></div>
          <div className="app-form-grid" style={{ marginTop: 15 }}>
            <div className="form-field form-field--full"><label htmlFor="settings-name">Full name</label><input id="settings-name" name="fullName" defaultValue={profile.fullName} required maxLength={100} /></div>
            <div className="form-field"><label htmlFor="settings-chw-id">CHW ID</label><input id="settings-chw-id" name="chwId" defaultValue={profile.chwId} required maxLength={32} /></div>
            <div className="form-field"><label htmlFor="settings-county">County</label><select id="settings-county" name="county" defaultValue={profile.county}><option>Turkana</option><option>Kisii</option><option>Kajiado</option><option>Kilifi</option><option>Tana River</option></select></div>
            <div className="form-field"><label htmlFor="settings-subcounty">Sub-county</label><input id="settings-subcounty" name="subCounty" defaultValue={profile.subCounty} maxLength={80} /></div>
            <div className="form-field"><label htmlFor="settings-ward">Ward</label><input id="settings-ward" name="ward" defaultValue={profile.ward} maxLength={80} /></div>
          </div>
          {profileMessage && <p className="form-message" role="status">{profileMessage}</p>}
          <div className="app-form-actions"><button className="btn btn-primary" type="submit">Save profile</button></div>
        </form>
        <div className="setting-line"><div><strong>SMS follow-up reminders</strong><span>Provider integration and patient consent are required.</span></div><button className="switch-control" type="button" role="switch" aria-checked={smsReminders} aria-label="SMS reminders" onClick={() => { const next = !smsReminders; setSmsReminders(next); void setAppSetting("sms-reminders", next); }} /></div>
      </section>

      <section className="panel">
        <div className="panel-heading"><div><h2>Data export</h2><p>Export sensitive data carefully</p></div><Download size={19} /></div>
        <p className="metadata">CSV exports include patient names, visit notes, and immunisation dates. Save them only to an approved, protected location.</p>
        <div className="quick-actions" style={{ marginTop: 15 }}>
          <button className="quick-action" type="button" onClick={() => void onExport()}><span className="icon-box"><ArrowDownToLine /></span><span><strong>Export offline records as CSV</strong><span>Patients, visits, and immunisations</span></span></button>
          <button className="quick-action" type="button" disabled={!online || !authenticated} onClick={() => void onExportMoh()}><span className="icon-box"><FileText /></span><span><strong>Download MOH report preview</strong><span>{authenticated ? online ? "Aggregate PDF for county review" : "Connect to generate a report" : "Sign in to a county service first"}</span></span></button>
        </div>
        <div className="setting-line"><div><strong>Last local backup</strong><span>Local changes are encrypted in this browser profile.</span></div><span className="status-badge is-neutral">On device</span></div>
      </section>

      <section className="panel">
        <div className="panel-heading"><div><h2>Change local PIN</h2><p>Protects access to this browser workspace</p></div><ShieldCheck size={19} /></div>
        <form onSubmit={savePin}>
          {pinExists && <div className="form-field" style={{ marginBottom: 12 }}><label htmlFor="current-pin">Current PIN</label><input id="current-pin" name="currentPin" type="password" inputMode="numeric" autoComplete="current-password" required minLength={6} maxLength={12} /></div>}
          <div className="app-form-grid">
            <div className="form-field"><label htmlFor="new-pin">New PIN</label><input id="new-pin" name="newPin" type="password" inputMode="numeric" autoComplete="new-password" required minLength={6} maxLength={12} /></div>
            <div className="form-field"><label htmlFor="confirm-pin">Confirm PIN</label><input id="confirm-pin" name="confirmPin" type="password" inputMode="numeric" autoComplete="new-password" required minLength={6} maxLength={12} /></div>
          </div>
          {pinMessage && <p className="form-message" role="status">{pinMessage}</p>}
          <div className="app-form-actions"><button className="btn btn-primary" type="submit" disabled={pinBusy}>{pinBusy ? "Saving..." : pinExists ? "Update PIN" : "Set app PIN"}</button><span className="metadata">The PIN hash stays on this device.</span></div>
        </form>
      </section>

      <section className="panel">
        <div className="panel-heading"><div><h2>Report a problem</h2><p>Do not include patient or clinical details.</p></div><AlertCircle size={19} /></div>
        {!reportSent && <form onSubmit={submitProblem}>
          <div className="app-form-grid"><div className="form-field form-field--full"><label htmlFor="problem-email">Your email</label><input id="problem-email" type="email" autoComplete="email" required value={reportEmail} onChange={(event) => setReportEmail(event.target.value)} /></div><div className="form-field form-field--full"><label htmlFor="problem-message">What happened?</label><textarea id="problem-message" required maxLength={2500} value={reportMessage} onChange={(event) => setReportMessage(event.target.value)} placeholder="Describe the app issue, not a patient case." /></div></div>
          {reportForm.fallbackRequired && <div className="captcha-fallback" ref={reportForm.fallbackContainer} />}
          {reportForm.feedback && <p className={`form-message${reportForm.feedback.kind === "error" ? " is-error" : reportForm.feedback.kind === "success" ? " is-success" : ""}`} role="status">{reportForm.feedback.text}</p>}
          <div className="app-form-actions"><button className="btn btn-primary" type="submit" disabled={reportForm.submitting}>{reportForm.submitting ? "Sending..." : "Send problem report"}</button><span className="metadata">Online security check is invisible. Offline reports stay queued.</span></div>
        </form>}
        {reportSent && <p className="form-message is-success" role="status">Problem report saved. Thank you for helping improve the workspace.</p>}
      </section>
    </div>
    {authenticated && <section className="panel section-panel"><div className="panel-heading"><div><h2>Account</h2><p>Sign out of the county server on this device.</p></div></div><button className="btn btn-outline" type="button" onClick={() => void onLogout()}>Sign out</button></section>}
  </>;
}
