import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingHeader } from "@/components/MarketingHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { legalPages } from "@/lib/legal";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(legalPages).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = legalPages[slug];
  if (!page) return { title: "Legal information" };
  return {
    title: page.title,
    description: page.description,
    openGraph: { title: page.title, description: page.description, type: "article" },
  };
}

export default async function LegalPage({ params }: Props) {
  const { slug } = await params;
  const page = legalPages[slug];
  if (!page) notFound();
  return (
    <>
      <MarketingHeader />
      <main className="legal-page" id="main-content">
        <div className="container legal-layout">
          <aside className="legal-sidebar">
            <strong>Legal and privacy</strong>
            <nav aria-label="Legal pages">
              <Link href="/legal/privacy-policy">Privacy Policy</Link>
              <Link href="/legal/terms">Terms of Use</Link>
              <Link href="/legal/cookie-policy">Cookie Policy</Link>
            </nav>
            <p className="metadata" style={{ margin: "15px 0 0" }}>Updated {page.updated}. Review deployment agreements before live use.</p>
          </aside>
          <article className="legal-content">
            <span className="eyebrow">Raphael Community Health</span>
            <h1>{page.title}</h1>
            <p className="legal-lede">{page.description}</p>
            {page.sections.map((section) => (
              <section id={section.id} key={section.id}>
                <h2>{section.title}</h2>
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.bullets && <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}
              </section>
            ))}
            <p className="metadata" style={{ marginTop: 24 }}>Last updated {page.updated}.</p>
          </article>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
