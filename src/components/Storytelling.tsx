"use client";

import { useEffect, useState } from "react";
import { CloudOff, Database, RefreshCw, ShieldCheck } from "lucide-react";

const chapters = [
  {
    title: "A remote homestead. No signal.",
    copy: "The CHW arrives for a planned household visit. There is no mobile signal, but the patient list and visit form are already on her phone.",
    image: "/images/community-health-visit.jpg",
    alt: "A community health worker visiting a family outdoors",
    icon: CloudOff,
    badge: "No signal needed",
  },
  {
    title: "She records the visit on her phone.",
    copy: "Observations, follow-up dates, and a referral note are saved securely on the device. The visit appears in the local patient history straight away.",
    image: "/images/village-outreach.jpg",
    alt: "A health worker and children during an outdoor community visit",
    icon: Database,
    badge: "Saved on this device",
  },
  {
    title: "Signal returns on the way to town.",
    copy: "The pending queue starts a secure sync when the worker reconnects. Each confirmed record is removed from the queue and added to the local sync log.",
    image: "/images/field-clinic-support.jpg",
    alt: "A nurse supporting a patient during a field clinic visit",
    icon: RefreshCw,
    badge: "Sync when connected",
  },
  {
    title: "The county team reviews the update.",
    copy: "Once the county account and data-sharing workflow are configured, authorised officers can review aggregate community activity and reporting exports.",
    image: "/images/rural-community-care.jpg",
    alt: "A healthcare worker providing community care",
    icon: ShieldCheck,
    badge: "County-approved access",
  },
];

export function Storytelling() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-story-chapter]"));
    if (!nodes.length || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      const mostVisible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (mostVisible) setActive(Number((mostVisible.target as HTMLElement).dataset.storyChapter ?? 0));
    }, { rootMargin: "-28% 0px -28% 0px", threshold: [0.1, 0.25, 0.5, 0.75] });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const chapter = chapters[active] ?? chapters[0];
  const Icon = chapter.icon;
  return (
    <section className="section story-section" id="about" aria-labelledby="story-title">
      <div className="container">
        <div className="section-heading section-heading--left">
          <span className="eyebrow"><span className="eyebrow-dot" /> A field day, made simpler</span>
          <h2 id="story-title">Four moments from the field</h2>
          <p>The product follows the way community care happens: visit first, connection later.</p>
        </div>
        <div className="story-grid">
          <div className="story-visual" aria-live="polite">
            <img key={chapter.image} src={chapter.image} alt={chapter.alt} loading="lazy" />
            <div className="story-visual-content">
              <span className="story-step"><Icon size={15} /> {chapter.badge}</span>
              <h3>{chapter.title}</h3>
              <p>Local records are ready before the network is.</p>
            </div>
          </div>
          <div className="story-chapters">
            {chapters.map((item, index) => {
              const ChapterIcon = item.icon;
              return (
                <article className={`story-chapter${active === index ? " is-active" : ""}`} data-story-chapter={index} key={item.title}>
                  <span className="story-number">Step 0{index + 1}</span>
                  <h3>{item.title}</h3>
                  <p>{item.copy}</p>
                  <span className="story-chip"><ChapterIcon /> {item.badge}</span>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
