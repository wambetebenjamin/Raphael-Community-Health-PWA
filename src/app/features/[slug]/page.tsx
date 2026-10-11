import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { MarketingHeader } from "@/components/MarketingHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { features } from "@/lib/content";

type Props = { params: Promise<{ slug: string }> };
export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return features.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const feature = features.find((item) => item.slug === slug);
  if (!feature) return { title: "Feature" };
  return {
    title: feature.title,
    description: feature.description,
    openGraph: {
      title: `${feature.title} | Raphael Community Health`,
      description: feature.description,
      type: "article",
      images: [{ url: "/images/village-outreach.jpg", width: 500, height: 333, alt: "Community health visit" }],
    },
  };
}

export default async function FeaturePage({ params }: Props) {
  const { slug } = await params;
  const feature = features.find((item) => item.slug === slug);
  if (!feature) notFound();
  const Icon = feature.Icon;
  return (
    <>
      <MarketingHeader />
      <main id="main-content">
        <section className="detail-hero">
          <div className="container detail-hero-grid">
            <div>
              <span className="eyebrow"><span className="eyebrow-dot" /> Raphael field toolkit</span>
              <h1>{feature.title}</h1>
              <p>{feature.description} {feature.details}</p>
              <div className="hero-actions"><Link className="btn btn-primary" href="/sign-up">Try the free workspace <ArrowRight /></Link><Link className="btn btn-outline" href="/#features">All features</Link></div>
            </div>
            <div className="detail-icon-large" aria-hidden="true"><Icon /></div>
          </div>
        </section>
        <section className="container detail-body">
          <span className="eyebrow">Built for the field</span>
          <h2>Designed for low-connectivity work</h2>
          <p>{feature.details}</p>
          <div className="panel">
            <h2 style={{ fontSize: 19, marginBottom: 13 }}>What this workflow supports</h2>
            <ul className="price-includes">
              <li><Check /> Continue working when a connection drops.</li>
              <li><Check /> Keep saved changes on the device until confirmed.</li>
              <li><Check /> Review what has synced in the local status screen.</li>
            </ul>
          </div>
          <p><ShieldCheck size={17} style={{ verticalAlign: "-3px", marginRight: 7 }} /> Patient data access depends on county approval, a configured account, and the applicable data-sharing agreement.</p>
          <Link className="text-link" href="/sign-up">Register as a community health worker <ArrowRight /></Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
