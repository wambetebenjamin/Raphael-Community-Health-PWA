"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, LoaderCircle, LockKeyhole } from "lucide-react";
import { usePublicForm } from "@/components/use-public-form";
import { saveChwProfile, setWorkspaceId } from "@/lib/offline-db";
import type { ChwProfile } from "@/lib/types";

type AuthResult = { success: boolean; message: string; profile: Omit<ChwProfile, "demo"> };
const counties = ["Turkana", "Kisii", "Kajiado", "Kilifi", "Tana River"] as const;

export function SignInForm() {
  const router = useRouter();
  const [chwId, setChwId] = useState("");
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError(false);
    if (!navigator.onLine) { setError(true); setMessage("You are offline. Open your saved field workspace at /app, then sign in when you reconnect."); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", cache: "no-store", body: JSON.stringify({ action: "sign-in", chwId, pin }) });
      const data = await response.json().catch(() => ({})) as AuthResult & { error?: string };
      if (!response.ok || !data.profile) throw new Error(data.message ?? data.error ?? "Sign-in could not be completed.");
      setWorkspaceId(data.profile.chwId);
      await saveChwProfile({ ...data.profile, demo: false });
      setMessage("Signed in. Opening your field workspace...");
      router.replace("/app");
      router.refresh();
    } catch (reason) {
      setError(true);
      setMessage(reason instanceof Error ? reason.message : "The account service is not available.");
    } finally { setBusy(false); }
  };

  return <div className="auth-card">
    <span className="eyebrow"><LockKeyhole size={14} /> Secure CHW access</span>
    <h2>Welcome back</h2>
    <p>Sign in to sync records with your authorised county workspace. Your saved local records remain on this device.</p>
    <form onSubmit={submit}>
      <div className="form-field" style={{ marginBottom: 14 }}><label htmlFor="signin-chw-id">CHW ID</label><input id="signin-chw-id" value={chwId} onChange={(event) => setChwId(event.target.value.toUpperCase())} autoComplete="username" required maxLength={32} placeholder="For example, CHW-20418" /></div>
      <div className="form-field"><label htmlFor="signin-pin">PIN</label><input id="signin-pin" type="password" inputMode="numeric" autoComplete="current-password" value={pin} onChange={(event) => setPin(event.target.value)} required minLength={6} maxLength={12} /></div>
      {message && <p className={`form-message${error ? " is-error" : " is-success"}`} role="status">{message}</p>}
      <button className="btn btn-primary btn-block" type="submit" disabled={busy} style={{ marginTop: 17 }}>{busy ? <LoaderCircle className="spin-icon" /> : <ArrowRight />} {busy ? "Signing in..." : "Sign In"}</button>
    </form>
    <p className="auth-switch">New to the platform? <Link href="/sign-up">Register as a CHW</Link></p>
    <p className="metadata" style={{ marginTop: 16, textAlign: "center" }}>Need local access while offline? <Link href="/app">Open the offline workspace</Link>.</p>
  </div>;
}

export function SignUpForm() {
  const router = useRouter();
  const form = usePublicForm("register");
  const [confirmPin, setConfirmPin] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const pin = String(formData.get("pin") ?? "");
    if (pin !== confirmPin) { form.setFeedback({ kind: "error", text: "The PINs do not match." }); return; }
    if (!navigator.onLine) { form.showOfflineMessage("Registration needs a secure connection and online security check. You can still use your offline workspace while you reconnect."); return; }
    const values = {
      action: "register",
      fullName: String(formData.get("fullName") ?? "").trim(),
      chwId: String(formData.get("chwId") ?? "").trim().toUpperCase(),
      county: String(formData.get("county") ?? ""),
      subCounty: String(formData.get("subCounty") ?? "").trim(),
      ward: String(formData.get("ward") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      pin,
      consent: formData.get("consent") === "on",
    };
    const result = await form.submitOnline<AuthResult>("/api/auth", values);
    if (result?.profile) {
      setWorkspaceId(result.profile.chwId);
      await saveChwProfile({ ...result.profile, demo: false });
      router.replace("/app");
      router.refresh();
    }
  };

  return <div className="auth-card">
    <span className="eyebrow"><LockKeyhole size={14} /> Free individual account</span>
    <h2>Register as a CHW</h2>
    <p>Create a local workspace for up to 50 patients. Online registration requires a secure county setup.</p>
    <form onSubmit={submit}>
      <div className="app-form-grid">
        <div className="form-field form-field--full"><label htmlFor="signup-name">Full name</label><input id="signup-name" name="fullName" autoComplete="name" required maxLength={100} /></div>
        <div className="form-field"><label htmlFor="signup-chw-id">CHW ID number</label><input id="signup-chw-id" name="chwId" autoComplete="username" required minLength={3} maxLength={32} placeholder="Issued by your programme" /></div>
        <div className="form-field"><label htmlFor="signup-county">County</label><select id="signup-county" name="county" required defaultValue=""><option value="">Choose a county</option>{counties.map((county) => <option key={county}>{county}</option>)}</select></div>
        <div className="form-field"><label htmlFor="signup-subcounty">Sub-county</label><input id="signup-subcounty" name="subCounty" required maxLength={80} /></div>
        <div className="form-field"><label htmlFor="signup-ward">Ward</label><input id="signup-ward" name="ward" required maxLength={80} /></div>
        <div className="form-field"><label htmlFor="signup-email">Email</label><input id="signup-email" name="email" type="email" autoComplete="email" required /></div>
        <div className="form-field"><label htmlFor="signup-phone">Phone</label><input id="signup-phone" name="phone" type="tel" autoComplete="tel" required maxLength={24} placeholder="+254 7XX XXX XXX" /></div>
        <div className="form-field"><label htmlFor="signup-pin">Create PIN</label><input id="signup-pin" name="pin" type="password" inputMode="numeric" autoComplete="new-password" required minLength={6} maxLength={12} /></div>
        <div className="form-field"><label htmlFor="signup-confirm-pin">Confirm PIN</label><input id="signup-confirm-pin" type="password" inputMode="numeric" autoComplete="new-password" required minLength={6} maxLength={12} value={confirmPin} onChange={(event) => setConfirmPin(event.target.value)} /></div>
        <label className="check-row form-field--full"><input name="consent" type="checkbox" required /><span>I confirm this account is authorised by my county or health programme. I have reviewed the <Link href="/legal/privacy-policy">Privacy Policy</Link> and <Link href="/legal/terms">Terms of Use</Link>.</span></label>
      </div>
      {form.fallbackRequired && <div className="captcha-fallback"><p className="metadata">Complete the security check to finish registration.</p><div ref={form.fallbackContainer} /></div>}
      {form.feedback && <p className={`form-message${form.feedback.kind === "error" ? " is-error" : form.feedback.kind === "success" ? " is-success" : ""}`} role="status">{form.feedback.text}</p>}
      <p className="form-footnote">Invisible reCAPTCHA runs only while online. It does not block offline patient visits.</p>
      <button className="btn btn-primary btn-block" type="submit" disabled={form.submitting} style={{ marginTop: 15 }}>{form.submitting ? <LoaderCircle className="spin-icon" /> : <ArrowRight />} {form.submitting ? "Creating account..." : "Create free account"}</button>
    </form>
    <p className="auth-switch">Already registered? <Link href="/sign-in">Sign in</Link></p>
  </div>;
}
