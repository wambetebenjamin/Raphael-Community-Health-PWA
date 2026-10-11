"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CalendarDays,
  Check,
  CloudOff,
  CloudUpload,
  FileText,
  Home,
  LoaderCircle,
  LogOut,
  MessageCircle,
  Settings,
  UsersRound,
  Wifi,
} from "lucide-react";
import { Brand } from "@/components/Brand";
import { useConnectivity } from "@/hooks/use-connectivity";
import {
  exportOfflineCsv,
  getChwProfile,
  getImmunisations,
  getPatients,
  getPendingQueue,
  getSyncLogs,
  getVisits,
  hasLocalPin,
  saveChwProfile,
  saveImmunisation,
  savePatient,
  saveSyncLog,
  saveVisit,
  seedDemoData,
  setWorkspaceId,
  verifyLocalPin,
} from "@/lib/offline-db";
import { processPendingRecords } from "@/lib/sync";
import type { ChwProfile, ImmunisationRecord, Patient, SyncLogEntry, Visit } from "@/lib/types";
import {
  HomeView,
  PatientDetailModal,
  PatientEditor,
  PatientsView,
  SettingsView,
  SyncView,
  VisitsView,
  VisitEditor,
} from "@/components/app/AppViews";

type Tab = "home" | "patients" | "visits" | "sync" | "settings";
const tabs: { id: Tab; label: string; Icon: typeof Home }[] = [
  { id: "home", label: "Home", Icon: Home },
  { id: "patients", label: "Patients", Icon: UsersRound },
  { id: "visits", label: "Visits", Icon: CalendarDays },
  { id: "sync", label: "Sync", Icon: CloudUpload },
  { id: "settings", label: "Settings", Icon: Settings },
];

const whatsappHelp = "https://wa.me/254112272061?text=Hello%2C%20I%20need%20help%20with%20Raphael%20Community%20Health.";

type AuthProfile = { fullName: string; chwId: string; county: ChwProfile["county"]; subCounty: string; ward: string; email?: string; phone?: string };

export function AppDashboard() {
  const { online, showBanner, message: connectionMessage } = useConnectivity();
  const [tab, setTab] = useState<Tab>("home");
  const [profile, setProfile] = useState<ChwProfile>({ fullName: "Community health worker", chwId: "CHW-LOCAL", county: "Turkana", subCounty: "", ward: "", demo: true });
  const [patients, setPatients] = useState<Patient[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [immunisations, setImmunisations] = useState<ImmunisationRecord[]>([]);
  const [pending, setPending] = useState<{ id: string; kind: string; createdAt: string }[]>([]);
  const [logs, setLogs] = useState<SyncLogEntry[]>([]);
  const [authenticated, setAuthenticated] = useState(false);
  const [initialised, setInitialised] = useState(false);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [lastSynced, setLastSynced] = useState("Not yet");
  const [toast, setToast] = useState("");
  const [storageError, setStorageError] = useState("");
  const [pinLocked, setPinLocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [unlocking, setUnlocking] = useState(false);

  const refreshAll = useCallback(async () => {
    try {
      const [patientRecords, visitRecords, vaccineRecords, queueRecords, logRecords, savedProfile] = await Promise.all([
        getPatients(), getVisits(), getImmunisations(), getPendingQueue(), getSyncLogs(), getChwProfile(),
      ]);
      setPatients(patientRecords);
      setVisits(visitRecords);
      setImmunisations(vaccineRecords);
      setPending(queueRecords.map(({ id, kind, createdAt }) => ({ id, kind, createdAt })));
      setLogs(logRecords);
      setProfile(savedProfile);
      const lastSuccess = logRecords.find((entry) => entry.status === "success");
      setLastSynced(lastSuccess ? new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Nairobi" }).format(new Date(lastSuccess.createdAt)) : "Not yet");
      setStorageError("");
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : "Local health storage could not be opened.");
    }
  }, []);

  const loadServerSession = useCallback(async () => {
    if (!navigator.onLine) return null;
    try {
      const response = await fetch("/api/auth", { credentials: "same-origin", cache: "no-store" });
      if (!response.ok) return null;
      const data = await response.json() as { authenticated?: boolean; profile?: AuthProfile | null };
      if (!data.authenticated || !data.profile?.chwId) return null;
      return data.profile;
    } catch {
      return null;
    }
  }, []);

  const initialiseWorkspace = useCallback(async () => {
    const serverProfile = await loadServerSession();
    if (serverProfile) {
      setWorkspaceId(serverProfile.chwId);
      const localProfile: ChwProfile = { ...serverProfile, demo: false };
      await saveChwProfile(localProfile).catch(() => undefined);
      setAuthenticated(true);
    } else {
      setAuthenticated(false);
      if (!navigator.onLine) {
        // The last workspace ID is kept locally so previously synced CHWs can open their records offline.
      }
      if (!localStorage.getItem("rchw-workspace-id")) {
        setWorkspaceId(null);
        await seedDemoData().catch((error) => setStorageError(error instanceof Error ? error.message : "Demo data could not be prepared."));
      }
    }
    const hasPin = await hasLocalPin().catch(() => false);
    if (hasPin) setPinLocked(true);
    await refreshAll();
    setInitialised(true);
  }, [loadServerSession, refreshAll]);

  useEffect(() => {
    let active = true;
    const start = async () => {
      await initialiseWorkspace();
      if (!active) return;
    };
    void start();
    const handleDbChange = () => { void refreshAll(); };
    window.addEventListener("rchw-db-change", handleDbChange);
    return () => {
      active = false;
      window.removeEventListener("rchw-db-change", handleDbChange);
    };
  }, [initialiseWorkspace, refreshAll]);

  useEffect(() => {
    if (!online || !initialised) return;
    let cancelled = false;
    void loadServerSession().then(async (serverProfile) => {
      if (cancelled) return;
      if (serverProfile) {
        if (serverProfile.chwId !== profile.chwId) {
          setWorkspaceId(serverProfile.chwId);
          const localProfile: ChwProfile = { ...serverProfile, demo: false };
          await saveChwProfile(localProfile).catch(() => undefined);
          await refreshAll();
        }
        setAuthenticated(true);
      } else {
        setAuthenticated(false);
      }
    });
    return () => { cancelled = true; };
  }, [online, initialised, loadServerSession, profile.chwId, refreshAll]);

  const runSync = useCallback(async () => {
    if (!navigator.onLine) {
      setSyncMessage("You are offline. Records remain encrypted and saved on this device.");
      return;
    }
    setSyncing(true);
    setSyncMessage("Checking your secure sync queue...");
    try {
      const result = await processPendingRecords({ authenticated, publicForms: false });
      setSyncMessage(result.message);
      if (result.synced > 0) setLastSynced(new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Nairobi" }).format(new Date()));
      await refreshAll();
    } catch (error) {
      const text = error instanceof Error ? error.message : "Sync is paused. Your local records are still safe.";
      setSyncMessage(text);
      await saveSyncLog({ status: "failed", message: `Sync paused: ${text}` }).catch(() => undefined);
      await refreshAll();
    } finally {
      setSyncing(false);
    }
  }, [authenticated, refreshAll]);

  useEffect(() => {
    if (online && initialised && authenticated && pending.some((record) => ["patient", "visit", "immunisation"].includes(record.kind))) {
      void runSync();
    }
  }, [online, initialised, authenticated, pending, runSync]);

  const openPatientForm = () => { setTab("patients"); setShowPatientForm(true); setShowVisitForm(false); setSelectedPatient(null); };
  const openVisitForm = () => { setTab("visits"); setShowVisitForm(true); setShowPatientForm(false); setSelectedPatient(null); };

  const handlePatientSave = async (patient: Patient) => {
    const activeCount = patients.filter((record) => !record.sample).length;
    if (activeCount >= 50) throw new Error("The free CHW workspace supports up to 50 patients. Contact your county about a team package.");
    await savePatient(patient);
    setShowPatientForm(false);
    setToast("Patient saved on this device.");
    window.setTimeout(() => setToast(""), 2800);
    await refreshAll();
    if (navigator.onLine && authenticated) void runSync();
  };

  const handleVisitSave = async (visit: Visit) => {
    await saveVisit(visit);
    setShowVisitForm(false);
    setToast("Visit saved on this device.");
    window.setTimeout(() => setToast(""), 2800);
    await refreshAll();
    if (navigator.onLine && authenticated) void runSync();
  };

  const handleImmunisationSave = async (record: ImmunisationRecord) => {
    await saveImmunisation(record);
    await refreshAll();
    if (navigator.onLine && authenticated) void runSync();
  };

  const handleExport = async () => {
    try {
      const csv = await exportOfflineCsv();
      const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `raphael-offline-export-${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      setToast("CSV export downloaded. Store it securely.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "The CSV export could not be created.");
    }
    window.setTimeout(() => setToast(""), 3200);
  };

  const handleMohExport = async () => {
    try {
      const response = await fetch("/api/reports/moh", { credentials: "same-origin", cache: "no-store" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as { message?: string };
        throw new Error(data.message ?? "The MOH report service is not configured.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "raphael-moh-report-preview.pdf";
      anchor.click();
      URL.revokeObjectURL(url);
      setToast("Report preview downloaded for county review.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "The report could not be generated.");
    }
    window.setTimeout(() => setToast(""), 3600);
  };

  const handleProfileSave = async (next: ChwProfile) => {
    await saveChwProfile(next);
    setProfile(next);
  };

  const handleLogout = async () => {
    try { await fetch("/api/auth", { method: "DELETE", credentials: "same-origin", cache: "no-store" }); } catch { /* Local records remain available on this device. */ }
    setAuthenticated(false);
    setWorkspaceId(null);
    await seedDemoData().catch(() => undefined);
    await refreshAll();
    setToast("Signed out of the county workspace. Local demo data remains separate.");
    window.setTimeout(() => setToast(""), 3500);
  };

  const unlock = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUnlocking(true);
    setPinError("");
    const valid = await verifyLocalPin(pinInput).catch(() => false);
    if (valid) { setPinLocked(false); setPinInput(""); }
    else setPinError("That PIN did not unlock this workspace.");
    setUnlocking(false);
  };

  const activeLabel = tabs.find((item) => item.id === tab)?.label ?? "Home";
  return (
    <div className={`app-shell${showBanner ? " has-offline-banner" : ""}`}>
      <header className="app-topbar">
        <Brand href="/app" compact />
        <div className="app-top-actions">
          <span className={`connection-pill${online ? "" : " is-offline"}`}><span className="sr-only">Connection status: </span>{online ? <Wifi /> : <CloudOff />} {online ? "Online" : "Offline"}</span>
          <a className="btn btn-outline btn-small app-help-button" href={whatsappHelp} target="_blank" rel="noreferrer"><MessageCircle /> Help</a>
          <span className="profile-chip"><span className="profile-avatar">{profile.fullName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span><span><strong>{profile.fullName}</strong><small>{profile.chwId}</small></span></span>
        </div>
      </header>

      {showBanner && <div className={`offline-banner${online ? " is-online" : ""}`} role="status" aria-live="polite"><span aria-hidden="true">{online ? <CloudUpload /> : <CloudOff />}</span>{online ? "Back online. Syncing your data..." : connectionMessage}</div>}

      <aside className="app-sidebar" aria-label="CHW workspace navigation">
        <p className="sidebar-label">Field workspace</p>
        <nav className="app-nav-list">{tabs.map(({ id, label, Icon }) => <button className="app-nav-button" key={id} type="button" aria-current={tab === id ? "page" : undefined} onClick={() => { setTab(id); setShowPatientForm(false); setShowVisitForm(false); }}>{<Icon />}<span>{label}</span>{id === "sync" && pending.length > 0 && <span className="nav-count">{pending.length}</span>}</button>)}</nav>
        <div className="sidebar-bottom"><div className="sidebar-help"><MessageCircle /><span><strong>Need help?</strong><span>Talk to the support team</span></span></div><a className="btn btn-outline btn-block" href={whatsappHelp} target="_blank" rel="noreferrer">Open WhatsApp help</a><Link className="text-link" href="/">Back to Raphael Health <LogOut /></Link></div>
      </aside>

      <main className="app-main" id="main-content">
        <div className="app-content">
          {storageError && <div className="form-message is-error" role="alert"><AlertCircle size={16} /> {storageError}</div>}
          {!initialised ? <div className="panel section-panel" role="status"><LoaderCircle className="spin-icon" /> Preparing your offline workspace...</div> : <>
            {tab === "home" && <HomeView profile={profile} patients={patients} visits={visits} pendingCount={pending.length} online={online} lastSynced={lastSynced} onTab={setTab} onNewPatient={openPatientForm} onNewVisit={openVisitForm} onSync={() => void runSync()} />}
            {tab === "patients" && <><PatientsView patients={patients} visits={visits} onNewPatient={openPatientForm} onOpenPatient={setSelectedPatient} />{showPatientForm && <PatientEditor profile={profile} onSave={handlePatientSave} onCancel={() => setShowPatientForm(false)} />}</>}
            {tab === "visits" && <><VisitsView patients={patients} visits={visits} onNewVisit={openVisitForm} />{showVisitForm && <VisitEditor patients={patients} onSave={handleVisitSave} onCancel={() => setShowVisitForm(false)} />}</>}
            {tab === "sync" && <SyncView online={online} queueCount={pending.length} logs={logs} lastSynced={lastSynced} authenticated={authenticated} syncing={syncing} syncMessage={syncMessage} onSync={() => void runSync()} />}
            {tab === "settings" && <SettingsView key={profile.chwId} profile={profile} online={online} authenticated={authenticated} onSaveProfile={handleProfileSave} onExport={handleExport} onExportMoh={handleMohExport} onLogout={handleLogout} />}
          </>}
        </div>
      </main>

      <nav className="app-bottom-nav" aria-label="Main workspace navigation">{tabs.map(({ id, label, Icon }) => <button key={id} type="button" aria-current={tab === id ? "page" : undefined} onClick={() => { setTab(id); setShowPatientForm(false); setShowVisitForm(false); }}><Icon /><span>{label}</span></button>)}</nav>

      {selectedPatient && <PatientDetailModal key={selectedPatient.id} patient={selectedPatient} visits={visits} immunisations={immunisations} onClose={() => setSelectedPatient(null)} onMarkVaccine={handleImmunisationSave} />}
      {pinLocked && <div className="pin-gate"><form className="pin-card" onSubmit={unlock}><span className="brand-mark"><Check /></span><h2>Unlock your field workspace</h2><p>Enter your local app PIN to open the saved records on this device.</p><div className="form-field"><label htmlFor="workspace-pin">App PIN</label><input id="workspace-pin" value={pinInput} onChange={(event) => setPinInput(event.target.value)} type="password" inputMode="numeric" autoComplete="current-password" minLength={6} maxLength={12} required autoFocus /></div>{pinError && <p className="form-message is-error" role="alert">{pinError}</p>}<button className="btn btn-primary btn-block" type="submit" disabled={unlocking}>{unlocking ? "Checking..." : "Unlock"}</button><p className="metadata" style={{ marginTop: 12 }}>If you have forgotten your PIN, contact your county workspace administrator before clearing local data.</p></form></div>}
      {toast && <div className="toast-message" role="status" aria-live="polite">{toast}</div>}
      <span className="sr-only" aria-live="polite">{activeLabel} tab selected.</span>
    </div>
  );
}
