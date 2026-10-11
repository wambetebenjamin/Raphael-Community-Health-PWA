import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, MapPin, ShieldCheck } from "lucide-react";
import { MarketingHeader } from "@/components/MarketingHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { counties } from "@/lib/content";

type Props = { params: Promise<{ slug: string }> };
export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return counties.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const county = counties.find((item) => item.slug === slug);
  if (!county) return { title: "County" };
  return {
    title: `Community health tools for ${county.name}`,
    description: county.summary,
    openGraph: {
      title: `Raphael Community Health in ${county.name}`,
      description: county.summary,
      type: "website",
      images: [{ url: "/images/community-health-visit.jpg", width: 500, height: 333, alt: "A community health visit" }],
    },
  };
}

export default async function CountyPage({ params }: Props) {
  const { slug } = await params;
  const county = counties.find((item) => item.slug === slug);
  if (!county) notFound();
  return (
    <>
      <MarketingHeader />
      <main id="main-content">
        <section className="detail-hero">
          <div className="container detail-hero-grid">
            <div>
              <span className="eyebrow"><MapPin size={15} /> {county.region}</span>
              <h1>Community health tools for {county.name}</h1>
              <p>{county.summary} Raphael is designed to keep approved field records available offline and sync when a secure connection returns.</p>
              <div className="hero-actions"><Link className="btn btn-primary" href="/#contact">Request a County Demo <ArrowRight /></Link><Link className="btn btn-outline" href="/#counties">All counties</Link></div>
            </div>
            <div className="detail-icon-large" aria-hidden="true"><MapPin /></div>
          </div>
        </section>
        <section className="container detail-body">
          <span className="eyebrow">County-first setup</span>
          <h2>Start with local workflows and data roles</h2>
          <p>Each deployment should be planned with the county health team. Confirm who controls each record, how a CHW is onboarded, how data is retained, and which report definitions are required before adding real patient information.</p>
          <div className="panel">
            <h2 style={{ fontSize: 19, marginBottom: 13 }}>Potential priorities for {county.name}</h2>
            <ul className="price-includes">{county.priorities.map((priority) => <li key={priority}><Check /> {priority}</li>)}</ul>
          </div>
          <p><ShieldCheck size={17} style={{ verticalAlign: "-3px", marginRight: 7 }} /> This page describes a product workflow, not an active county deployment or formal Ministry certification.</p>
          <Link className="text-link" href="/sign-up">Start with an individual CHW account <ArrowRight /></Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
