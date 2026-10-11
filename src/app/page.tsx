import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Building2,
  Check,
  CloudOff,
  HeartHandshake,
  FileText,
  LockKeyhole,
  MapPin,
  ShieldCheck,
  Smartphone,
  Wifi,
} from "lucide-react";
import { MarketingHeader } from "@/components/MarketingHeader";
import { Storytelling } from "@/components/Storytelling";
import { OfflineDemo } from "@/components/OfflineDemo";
import { PricingSection } from "@/components/PricingSection";
import { PartnershipForm } from "@/components/PartnershipForm";
import { NewsletterForm } from "@/components/NewsletterForm";
import { SiteFooter } from "@/components/SiteFooter";
import { VoiceTour } from "@/components/VoiceTour";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { counties, features } from "@/lib/content";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Raphael Community Health | Offline health records for Kenya CHWs",
  description: "Offline-first patient records, household visits, immunisation tracking, maternal health follow-up, and secure sync for community health workers in Kenya.",
  openGraph: {
    title: "Raphael Community Health",
    description: "Healthcare records that work without internet for Kenyan community health workers.",
    type: "website",
    images: [{ url: "/images/community-health-visit.jpg", width: 500, height: 333, alt: "A nurse administering a vaccination at an outdoor health facility" }],
  },
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    name: "Raphael Community Health",
    description: "A digital community health service supporting Kenyan health workers. This platform is not a patient-facing clinic.",
    medicalSpecialty: "PrimaryCare",
    areaServed: ["Turkana County", "Kisii County", "Kajiado County", "Kilifi County", "Tana River County", "Kenya"],
    availableService: { "@type": "MedicalProcedure", name: "Community health record support" },
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Raphael Community Health",
    applicationCategory: "HealthApplication",
    operatingSystem: "Android, iOS, Web",
    description: "Offline health records for Kenya community health workers.",
    offers: [
      { "@type": "Offer", price: "0", priceCurrency: "KES", name: "Individual CHW" },
      { "@type": "Offer", price: "1500", priceCurrency: "KES", name: "Clinic or Dispensary", priceSpecification: { "@type": "UnitPriceSpecification", price: "1500", priceCurrency: "KES", unitCode: "MON" } },
      { "@type": "Offer", price: "25000", priceCurrency: "KES", name: "County Package", priceSpecification: { "@type": "UnitPriceSpecification", price: "25000", priceCurrency: "KES", unitCode: "MON" } },
    ],
    featureList: "Offline patient records, visit logs, immunisation tracking, background sync, MOH report export",
  },
];

export default function HomePage() {
  const words = ["Healthcare", "Records", "That", "Work", "Without", "Internet."];
  return (
    <>
      <MarketingHeader />
      <main id="main-content">
        <section className="hero" id="home" aria-labelledby="hero-title">
          <div className="container hero-grid">
            <div className="hero-copy">
              <span className="eyebrow"><span className="eyebrow-dot" /> Digital tools for the last mile</span>
              <h1 id="hero-title" aria-label="Healthcare Records That Work Without Internet.">
                {words.map((word, index) => <span className={`word${index >= 4 ? " headline-accent" : ""}`} style={{ animationDelay: `${index * 55}ms` }} key={word}>{word}{index < words.length - 1 ? " " : ""}</span>)}
              </h1>
              <p className="hero-description">Built for Kenyan community health workers. Record visits, track patients, and sync data even from the most remote areas.</p>
              <div className="hero-actions">
                <Link className="btn btn-primary" href="/sign-up">Sign Up Free <ArrowUpRight /></Link>
                <a className="btn btn-secondary" href="#about">See How It Works <ArrowRight /></a>
              </div>
              <div className="offline-badge"><span className="offline-pulse" aria-hidden="true" /> Works offline.</div>
              <div className="hero-proof">
                <span><LockKeyhole /> Encrypted on your device</span>
                <span><Wifi /> Syncs when connected</span>
              </div>
            </div>
            <div className="hero-visual" aria-label="Community health worker using a phone outdoors">
              <div className="hero-photo-wrap">
                <img className="hero-photo" src="/images/community-health-visit.jpg" alt="A community health worker visiting a family outdoors" fetchPriority="high" width="500" height="333" />
                <span className="hero-photo-tint" />
                <div className="hero-image-caption"><strong>Care continues beyond the signal.</strong><span>Designed around real field routines.</span></div>
              </div>
              <div className="hero-float-card hero-float-card--sync">
                <span className="float-icon"><Check /></span><span><strong>Saved securely</strong><small>Ready for your next visit</small></span>
              </div>
              <div className="hero-float-card hero-float-card--visit">
                <span className="float-icon float-icon--blue"><Activity /></span><span><strong>Visit recorded</strong><small>On this device, right now</small></span>
              </div>
            </div>
          </div>
        </section>

        <div className="trust-band" aria-label="Designed for community health teams in Kenya">
          <div className="container trust-band-inner">
            <span className="trust-intro">Built for community health teams in</span>
            <div className="county-tags">{counties.map((county) => <Link className="county-tag" href={`/counties/${county.slug}`} key={county.slug}><MapPin /> {county.name}</Link>)}</div>
          </div>
        </div>

        <Storytelling />

        <section className="section features-section" id="features" aria-labelledby="features-title">
          <div className="container">
            <div className="section-heading">
              <span className="eyebrow"><span className="eyebrow-dot" /> A complete field toolkit</span>
              <h2 id="features-title">Practical tools for everyday community care</h2>
              <p>Everything a CHW needs to make a visit count, including when the nearest network signal is far away.</p>
            </div>
            <div className="feature-grid">
              {features.map(({ slug, title, description, Icon }, index) => (
                <Link className="feature-card reveal" style={{ animationDelay: `${index * 40}ms` }} href={`/features/${slug}`} key={slug}>
                  <span className="icon-box"><Icon /></span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <ArrowRight className="feature-arrow" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <OfflineDemo />

        <section className="section counties-section" id="counties" aria-labelledby="counties-title">
          <div className="container">
            <div className="section-heading">
              <span className="eyebrow"><span className="eyebrow-dot" /> Made for Kenya and East Africa</span>
              <h2 id="counties-title">Built around the places CHWs serve</h2>
              <p>Begin with the counties in the pilot brief, then configure the right workflow with each local health team.</p>
            </div>
            <div className="counties-grid">
              {counties.map((county) => <Link className="county-card" href={`/counties/${county.slug}`} key={county.slug}><MapPin /><strong>{county.name}</strong><span>{county.region}</span></Link>)}
            </div>
          </div>
        </section>

        <PricingSection />

        <section className="section compliance-section" id="compliance" aria-labelledby="compliance-title">
          <div className="container compliance-grid">
            <div>
              <span className="eyebrow"><span className="eyebrow-dot" /> Designed for county workflows</span>
              <h2 id="compliance-title">A careful path from field notes to reporting</h2>
              <p>CHWs can export locally stored data, while authorised county teams can review aggregate activity after the county workspace is configured. MOH reporting formats and DHIS2 hand-off points are designed to be reviewed with the county before deployment.</p>
              <p>Patient records are special category personal data. Access, retention, and data sharing must follow the county controller’s lawful instructions and the Kenya Data Protection Act, 2019.</p>
              <Link className="btn btn-secondary" href="#contact">Request a County Demo <ArrowRight /></Link>
            </div>
            <div className="compliance-cards">
              <div className="compliance-card"><span className="icon-box"><FileTextIcon /></span><div><strong>MOH report export</strong><span>Prepare an aggregate PDF for county review.</span></div></div>
              <div className="compliance-card"><span className="icon-box"><Building2 /></span><div><strong>County dashboard access</strong><span>Role-gated access for authorised officers.</span></div></div>
              <div className="compliance-card"><span className="icon-box"><ShieldCheck /></span><div><strong>NHIF and DHIS2 note</strong><span>Designed for review, not a claim of certification or active integration.</span></div></div>
            </div>
            <p className="compliance-note">The demo does not claim Ministry of Health or NHIF certification. Confirm clinical forms, reporting definitions, data-sharing agreements, and any DHIS2 integration with the relevant county before live use.</p>
          </div>
        </section>

        <section className="section testimonial-section" id="stories" aria-labelledby="stories-title">
          <div className="container">
            <div className="section-heading">
              <span className="eyebrow"><span className="eyebrow-dot" /> Field stories</span>
              <h2 id="stories-title">Designed for the realities of field work</h2>
              <p>These sample stories show the kind of feedback the team wants to learn from during county pilots.</p>
            </div>
            <div className="testimonial-grid">
              <article className="testimonial-card reveal"><span className="quote-mark">“</span><blockquote>I can write a follow-up while I am with the family, then send it after I reach a connected place.</blockquote><div className="testimonial-person"><span className="person-avatar">AE</span><div><strong>Amina Ekal</strong><span>Turkana · sample pilot story</span></div></div></article>
              <article className="testimonial-card reveal" style={{ animationDelay: "70ms" }}><span className="quote-mark">“</span><blockquote>Having the visit history on one screen helps me prepare before I start the next household round.</blockquote><div className="testimonial-person"><span className="person-avatar">WN</span><div><strong>Wanjiku Njeri</strong><span>Kisii · sample pilot story</span></div></div></article>
              <article className="testimonial-card reveal" style={{ animationDelay: "140ms" }}><span className="quote-mark">“</span><blockquote>The sync status makes it easier to see which reports are still on my phone after a long day.</blockquote><div className="testimonial-person"><span className="person-avatar">BO</span><div><strong>Bosire Ondieki</strong><span>Kajiado · sample pilot story</span></div></div></article>
            </div>
            <p className="sample-disclaimer">Illustrative examples only. These are not verified endorsements. Replace them with consented CHW quotations before public launch.</p>
          </div>
        </section>

        <section className="section contact-section" id="contact" aria-labelledby="contact-title">
          <div className="container contact-grid">
            <div className="contact-copy">
              <span className="eyebrow"><span className="eyebrow-dot" /> County and NGO partnerships</span>
              <h2 id="contact-title">Let’s plan a field-ready pilot</h2>
              <p>Tell us about your community health programme. A county or NGO enquiry can start with a practical conversation about workflows, data roles, and rollout support.</p>
              <div className="contact-point"><span className="icon-box"><HeartHandshake /></span><div><strong>For county health departments and NGOs</strong><span>Ask about a walkthrough, onboarding, or subscription.</span></div></div>
              <div className="contact-point"><span className="icon-box"><Smartphone /></span><div><strong>For community health workers</strong><span>Register for a free individual workspace with up to 50 patients.</span></div></div>
              <div className="contact-point"><span className="icon-box"><CloudOff /></span><div><strong>Offline-ready by design</strong><span>Online forms use reCAPTCHA. Offline enquiries stay on this device until reconnect.</span></div></div>
              <Link className="text-link" href="/sign-up">Register as a CHW <ArrowUpRight /></Link>
            </div>
            <PartnershipForm />
          </div>
        </section>

        <section className="newsletter-section" aria-labelledby="newsletter-title">
          <div className="container newsletter-inner">
            <div className="newsletter-copy">
              <h2 id="newsletter-title">Digital health updates for Kenyan health workers.</h2>
              <p>Occasional field tools, product updates, and community health resources.</p>
            </div>
            <NewsletterForm />
          </div>
        </section>
      </main>
      <SiteFooter />
      <VoiceTour />
      <WhatsAppButton />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}

function FileTextIcon() {
  return <FileText />;
}
