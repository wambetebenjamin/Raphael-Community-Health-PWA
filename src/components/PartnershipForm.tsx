"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { ArrowUpRight, LoaderCircle } from "lucide-react";
import { queuePublicSubmission } from "@/lib/offline-db";
import { usePublicForm } from "@/components/use-public-form";

const countyOptions = ["Turkana", "Kisii", "Kajiado", "Kilifi", "Tana River"];

export function PartnershipForm() {
  const form = usePublicForm("partnership");
  const [values, setValues] = useState({
    organisation: "",
    county: "",
    contactName: "",
    email: "",
    phone: "",
    chwCount: "",
    message: "",
    consent: false,
  });
  const update = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = event.target;
    setValues((previous) => ({ ...previous, [name]: type === "checkbox" ? (event.target as HTMLInputElement).checked : value }));
  };
  const send = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!values.consent) {
      form.setFeedback({ kind: "error", text: "Please agree to be contacted about this enquiry." });
      return;
    }
    if (!navigator.onLine) {
      try {
        await queuePublicSubmission("partnership", "/api/partnership", values);
        form.showOfflineMessage("Saved on this device. We will send the enquiry when a connection returns and the security check is available.");
        setValues({ organisation: "", county: "", contactName: "", email: "", phone: "", chwCount: "", message: "", consent: false });
      } catch (error) {
        form.setFeedback({ kind: "error", text: error instanceof Error ? error.message : "This enquiry could not be saved locally." });
      }
      return;
    }
    const result = await form.submitOnline("/api/partnership", values);
    if (result) setValues({ organisation: "", county: "", contactName: "", email: "", phone: "", chwCount: "", message: "", consent: false });
  };

  return (
    <form className="form-card" onSubmit={send}>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="partnership-organisation">Organisation name</label>
          <input id="partnership-organisation" name="organisation" autoComplete="organization" required value={values.organisation} onChange={update} placeholder="County health team or NGO" />
        </div>
        <div className="form-field">
          <label htmlFor="partnership-county">County</label>
          <select id="partnership-county" name="county" required value={values.county} onChange={update}>
            <option value="">Choose a county</option>
            {countyOptions.map((county) => <option value={county} key={county}>{county}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="partnership-contact">Contact name</label>
          <input id="partnership-contact" name="contactName" autoComplete="name" required value={values.contactName} onChange={update} placeholder="Your name" />
        </div>
        <div className="form-field">
          <label htmlFor="partnership-email">Work email</label>
          <input id="partnership-email" name="email" type="email" autoComplete="email" required value={values.email} onChange={update} placeholder="you@organisation.org" />
        </div>
        <div className="form-field">
          <label htmlFor="partnership-phone">Phone number</label>
          <input id="partnership-phone" name="phone" type="tel" autoComplete="tel" required value={values.phone} onChange={update} placeholder="+254 7XX XXX XXX" />
        </div>
        <div className="form-field">
          <label htmlFor="partnership-count">Number of CHWs</label>
          <select id="partnership-count" name="chwCount" required value={values.chwCount} onChange={update}>
            <option value="">Select an estimate</option>
            <option value="1-10">1 to 10</option>
            <option value="11-50">11 to 50</option>
            <option value="51-250">51 to 250</option>
            <option value="250+">More than 250</option>
          </select>
        </div>
        <div className="form-field form-field--full">
          <label htmlFor="partnership-message">What would you like to explore?</label>
          <textarea id="partnership-message" name="message" value={values.message} onChange={update} placeholder="Tell us about your county or community health programme." />
        </div>
        <label className="check-row form-field--full">
          <input name="consent" type="checkbox" checked={values.consent} onChange={update} />
          <span>I agree to be contacted about this partnership enquiry. Do not include patient details.</span>
        </label>
      </div>
      {form.fallbackRequired && <div className="captcha-fallback"><p className="metadata">Please complete the security check before submitting.</p><div ref={form.fallbackContainer} /></div>}
      {form.feedback && <p className={`form-message${form.feedback.kind === "error" ? " is-error" : form.feedback.kind === "success" ? " is-success" : ""}`} role="status">{form.feedback.text}</p>}
      <p className="form-footnote">Online enquiries use invisible reCAPTCHA. Offline enquiries are encrypted on this device until you reconnect.</p>
      <div className="form-submit">
        <button className="btn btn-primary" type="submit" disabled={form.submitting}>{form.submitting ? <LoaderCircle className="spin-icon" /> : <ArrowUpRight />} {form.submitting ? "Sending..." : "Request a county demo"}</button>
        <span className="metadata">We reply through your preferred contact details.</span>
      </div>
    </form>
  );
}
