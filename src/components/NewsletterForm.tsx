"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { queuePublicSubmission } from "@/lib/offline-db";
import { usePublicForm } from "@/components/use-public-form";

export function NewsletterForm() {
  const form = usePublicForm("newsletter");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!consent) {
      form.setFeedback({ kind: "error", text: "Please confirm you want to receive these updates." });
      return;
    }
    const values = { email, consent };
    if (!navigator.onLine) {
      try {
        await queuePublicSubmission("newsletter", "/api/newsletter", values);
        form.showOfflineMessage("Saved locally. We will submit your subscription when you reconnect.");
        setEmail("");
        setConsent(false);
      } catch (error) {
        form.setFeedback({ kind: "error", text: error instanceof Error ? error.message : "Your subscription could not be saved." });
      }
      return;
    }
    const result = await form.submitOnline("/api/newsletter", values);
    if (result) { setEmail(""); setConsent(false); }
  };

  return (
    <form className="newsletter-form" onSubmit={submit}>
      <div className="newsletter-fields">
        <label className="sr-only" htmlFor="newsletter-email">Email address</label>
        <input id="newsletter-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Your email address" />
        <label className="check-row newsletter-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>Send me occasional digital health updates.</span></label>
        {form.fallbackRequired && <div className="captcha-fallback" ref={form.fallbackContainer} />}
        {form.feedback && <p className={`form-message${form.feedback.kind === "error" ? " is-error" : form.feedback.kind === "success" ? " is-success" : ""}`} role="status">{form.feedback.text}</p>}
      </div>
      <button className="btn btn-primary" type="submit" disabled={form.submitting}>{form.submitting ? <LoaderCircle className="spin-icon" /> : <ArrowRight />} {form.submitting ? "Joining..." : "Sign me up"}</button>
    </form>
  );
}
