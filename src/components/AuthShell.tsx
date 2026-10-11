import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, CloudOff } from "lucide-react";
import { Brand } from "@/components/Brand";

export function AuthShell({ children, signUp = false }: { children: ReactNode; signUp?: boolean }) {
  return (
    <main className="auth-page" id="main-content">
      <section className="auth-visual">
        <Brand href="/" />
        <img className="auth-photo" src="/images/field-clinic-support.jpg" alt="Community health outreach in a local care setting" />
        <div className="auth-visual-copy">
          <span className="eyebrow"><span className="eyebrow-dot" /> Made for offline field work</span>
          <h1>Keep care moving, with or without a signal.</h1>
          <p>Private records stay on the device first. Sync happens only when the worker is signed in and a secure connection returns.</p>
          <span className="story-chip"><CloudOff /> Local-first. County-aware.</span>
        </div>
        <div className="auth-aside-note">{signUp ? "For CHWs and authorised community health teams." : "Your community health workspace."}</div>
      </section>
      <section className="auth-form-side">
        <div className="auth-card-wrap">
          <Link href="/" className="text-link auth-back"><ArrowLeft /> Back to home</Link>
          {children}
        </div>
      </section>
    </main>
  );
}
