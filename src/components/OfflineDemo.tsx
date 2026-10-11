"use client";

import { useEffect, useRef, useState } from "react";
import { Check, CloudOff, CloudUpload, Wifi, WifiOff, ArrowUpRight, CircleCheck } from "lucide-react";

export function OfflineDemo() {
  const [offline, setOffline] = useState(false);
  const [note, setNote] = useState("");
  const [queue, setQueue] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [uploaded, setUploaded] = useState(0);
  const [status, setStatus] = useState("All demo changes are saved locally.");
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  const simulateOffline = () => {
    setOffline(true);
    setUploaded(0);
    setStatus("Offline simulation is on. Demo API requests are paused.");
  };

  const addVisit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!note.trim()) return;
    setQueue((items) => [...items, note.trim()]);
    setStatus("Visit saved on this device. No API request was sent.");
    setNote("");
  };

  const restoreConnection = () => {
    if (!queue.length) {
      setOffline(false);
      setStatus("Connection restored. No demo records were waiting.");
      return;
    }
    setOffline(false);
    setSyncing(true);
    setUploaded(0);
    setStatus("Connection restored. Syncing demo records one by one.");
    queue.forEach((_, index) => {
      const timer = window.setTimeout(() => {
        setUploaded(index + 1);
        if (index === queue.length - 1) {
          setSyncing(false);
          setQueue([]);
          setStatus("Demo records synced. Your field app is ready for the next visit.");
        }
      }, 700 * (index + 1));
      timers.current.push(timer);
    });
  };

  return (
    <section className="section demo-section" id="offline-demo" aria-labelledby="demo-title">
      <div className="container">
        <div className="section-heading">
          <span className="eyebrow"><span className="eyebrow-dot" /> Try the offline workflow</span>
          <h2 id="demo-title">Keep working when the signal drops</h2>
          <p>Pause the demo connection, record a sample visit, and watch the queue wait for a connection.</p>
        </div>
        <div className="demo-panel">
          <div className="demo-copy">
            <span className="eyebrow">A tiny field simulation</span>
            <h2>Offline does not mean out of work.</h2>
            <p>This sandbox demo simulates the local-first flow without contacting an API. The CHW app uses IndexedDB and a secure background sync queue for real records.</p>
            <ul className="demo-list">
              <li><Check /> Keep the patient list open</li>
              <li><Check /> Save a dummy visit locally</li>
              <li><Check /> Review each record as it syncs</li>
            </ul>
            <div className="demo-actions">
              {!offline && !syncing
                ? <button className="btn btn-primary" type="button" onClick={simulateOffline}><WifiOff /> Simulate Offline Mode</button>
                : <button className="btn btn-secondary" type="button" onClick={restoreConnection} disabled={syncing}><Wifi /> {syncing ? "Syncing records..." : "Restore Connection"}</button>}
              <span className="metadata" role="status" aria-live="polite">{status}</span>
            </div>
          </div>
          <div className="demo-screen">
            <span className={`demo-connection${offline ? " is-offline" : ""}`}><span aria-hidden="true">●</span> {offline ? "Offline demo" : syncing ? "Syncing" : "Connected"}</span>
            <div className="phone-frame">
              <div className="phone-top"><span>9:41</span><span>•••</span></div>
              <div className="phone-app-header">
                <strong>Today’s field visits</strong>
                <span className="demo-status">{offline ? "Saved on device" : "Ready to sync"}</span>
              </div>
              <div className="demo-visit">
                <small>Household 017 · Loima</small>
                <strong>Follow-up visit</strong>
                <p>Patient history and next visit are available offline.</p>
              </div>
              <form className="demo-form" onSubmit={addVisit}>
                <label className="sr-only" htmlFor="demo-note">Sample visit note</label>
                <input id="demo-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add a dummy visit note" disabled={!offline || syncing} />
                <button type="submit" aria-label="Save dummy visit" disabled={!offline || syncing}><ArrowUpRight /></button>
              </form>
              <div className="demo-queue"><span>Pending records</span><strong>{syncing ? `${Math.max(queue.length - uploaded, 0)} remaining` : queue.length}</strong></div>
              {syncing ? (
                <div className="demo-upload" aria-live="polite">
                  {queue.slice(0, uploaded).map((item, index) => <div className="upload-row" key={`${item}-${index}`}><span>Sample visit {String(index + 1).padStart(2, "0")}</span><CircleCheck /></div>)}
                  {uploaded < queue.length && <div className="upload-row"><span>Uploading the next record</span><CloudUpload /></div>}
                </div>
              ) : queue.length > 0 ? (
                <div className="demo-upload"><div className="upload-row"><span>{queue.length} sample visit{queue.length === 1 ? "" : "s"} waiting</span><CloudOff /></div></div>
              ) : (
                <div className="demo-upload"><div className="upload-row"><span>Local storage ready</span><Check /></div></div>
              )}
            </div>
            <span className="sr-only" aria-live="polite">{offline ? "Offline mode simulated." : syncing ? `${uploaded} records uploaded.` : "Connection available."}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
