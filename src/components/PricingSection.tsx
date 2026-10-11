"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Individual CHW",
    description: "A focused start for one community health worker.",
    monthly: "Free",
    annual: "Free",
    period: "",
    features: ["Up to 50 patient records", "Offline visits and follow-ups", "Immunisation tracking", "Community support"],
    cta: "Start for free",
    href: "/sign-up",
  },
  {
    name: "Clinic or Dispensary",
    description: "A shared workspace for a local care team.",
    monthly: "KES 1,500",
    annual: "KES 15,000",
    period: "month",
    features: ["Everything in Individual", "Clinic team workspace", "MOH report export", "Priority email support"],
    cta: "Talk about a clinic plan",
    href: "#contact",
    featured: true,
  },
  {
    name: "County Package",
    description: "A county-wide programme for connected CHW teams.",
    monthly: "KES 25,000",
    annual: "KES 250,000",
    period: "month",
    features: ["Unlimited CHW accounts", "County dashboard access", "County onboarding and training", "Dedicated implementation support"],
    cta: "Request a county demo",
    href: "#contact",
  },
];

export function PricingSection() {
  const [annual, setAnnual] = useState(false);
  return (
    <section className="section pricing-section" id="pricing" aria-labelledby="pricing-title">
      <div className="container">
        <div className="section-heading">
          <span className="eyebrow"><span className="eyebrow-dot" /> Simple county-ready pricing</span>
          <h2 id="pricing-title">Start with one CHW. Grow with your county.</h2>
          <p>Keep an individual field workflow free, then add team and county support as your programme grows.</p>
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div className="billing-toggle" role="group" aria-label="Billing frequency">
            <button type="button" aria-pressed={!annual} onClick={() => setAnnual(false)}>Monthly</button>
            <button type="button" aria-pressed={annual} onClick={() => setAnnual(true)}>Annual</button>
            <span className="billing-save">2 months free</span>
          </div>
        </div>
        <div className="pricing-grid">
          {plans.map((plan) => (
            <article className={`price-card${plan.featured ? " is-featured" : ""}`} key={plan.name}>
              {plan.featured && <span className="plan-badge">Most popular</span>}
              <h3>{plan.name}</h3>
              <p className="price-description">{plan.description}</p>
              <div className="price-amount"><strong>{annual ? plan.annual : plan.monthly}</strong>{plan.period && <span>/ {annual ? "year" : plan.period}</span>}</div>
              <p className="price-billing-note">{plan.name === "Individual CHW" ? "No card required" : annual ? "Billed annually" : "Cancel or change at renewal"}</p>
              <div className="price-divider" />
              <ul className="price-includes">{plan.features.map((feature) => <li key={feature}><Check /> {feature}</li>)}</ul>
              <Link className={`btn ${plan.featured ? "btn-primary" : "btn-outline"} btn-block`} href={plan.href}>{plan.cta}</Link>
            </article>
          ))}
        </div>
        <p className="metadata" style={{ margin: "17px auto 0", textAlign: "center" }}>Prices shown in Kenyan shillings. County and clinic subscriptions require an implementation agreement.</p>
      </div>
    </section>
  );
}
