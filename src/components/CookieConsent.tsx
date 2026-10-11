"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShieldCheck, X } from "lucide-react";
import { setAppSetting } from "@/lib/offline-db";

type Consent = { necessary: true; functional: boolean; analytics: boolean; savedAt: string };

const STORAGE_KEY = "raphael-health-cookie-consent";

export function CookieConsent() {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [functional, setFunctional] = useState(true);
  const [analytics, setAnalytics] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setConsent(JSON.parse(stored) as Consent);
    } catch {
      // A blocked storage setting must not block access to the health app.
    }
    setReady(true);
  }, []);

  const persist = async (next: Omit<Consent, "savedAt">) => {
    const saved: Consent = { ...next, savedAt: new Date().toISOString() };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch { /* Keep the app usable if storage is restricted. */ }
    setConsent(saved);
    setPreferencesOpen(false);
    await setAppSetting("cookie-consent", saved).catch(() => undefined);
  };

  if (!ready || consent) return null;
  return (
    <>
      <aside className="cookie-banner" aria-label="Cookie consent">
        <p>
          Raphael Health uses cookies to save your session and preferences locally on your device. No patient data is shared externally without your consent. See our{" "}
          <Link href="/legal/cookie-policy">Cookie Policy</Link>.
        </p>
        <div className="cookie-banner-actions">
          <button className="btn btn-primary" type="button" onClick={() => void persist({ necessary: true, functional: true, analytics: true })}>Accept All</button>
          <button className="btn btn-outline" type="button" onClick={() => setPreferencesOpen(true)}>Manage Preferences</button>
        </div>
      </aside>
      {preferencesOpen && (
        <div className="cookie-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreferencesOpen(false); }}>
          <section className="cookie-modal" role="dialog" aria-modal="true" aria-labelledby="cookie-title">
            <div className="modal-header">
              <div><span className="eyebrow"><ShieldCheck size={14} /> Device privacy</span><h2 id="cookie-title">Cookie preferences</h2></div>
              <button className="icon-button" type="button" aria-label="Close preferences" onClick={() => setPreferencesOpen(false)}><X /></button>
            </div>
            <p>Preferences are stored locally in your browser and IndexedDB. Health records are stored separately in encrypted IndexedDB for offline access, and are sent only to an authorised county service when a CHW account is signed in and sync is requested.</p>
            <div className="cookie-category">
              <div><strong>Necessary</strong><span>Required for offline storage, session safety, and core app functions. Always on.</span></div>
              <input type="checkbox" checked readOnly aria-label="Necessary cookies are always on" />
            </div>
            <label className="cookie-category">
              <div><strong>Functional</strong><span>Saves display choices and app preferences on this device.</span></div>
              <input type="checkbox" checked={functional} onChange={(event) => setFunctional(event.target.checked)} aria-label="Allow functional cookies" />
            </label>
            <label className="cookie-category">
              <div><strong>Analytics</strong><span>Optional, privacy-conscious usage measurement. Not enabled in this demo.</span></div>
              <input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} aria-label="Allow analytics cookies" />
            </label>
            <p className="metadata">Patient health information is sensitive personal data under the Kenya Data Protection Act, 2019. It is not used for advertising.</p>
            <div className="cookie-modal-actions">
              <button className="btn btn-primary" type="button" onClick={() => void persist({ necessary: true, functional, analytics })}>Save Preferences</button>
              <button className="btn btn-outline" type="button" onClick={() => void persist({ necessary: true, functional: true, analytics: true })}>Accept All</button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
