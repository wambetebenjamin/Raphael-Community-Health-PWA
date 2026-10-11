"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Brand } from "@/components/Brand";

const navItems = [
  ["Home", "home"],
  ["Features", "features"],
  ["Counties", "counties"],
  ["Pricing", "pricing"],
  ["About", "about"],
  ["Contact", "contact"],
] as const;

export function MarketingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 18);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);

  const hrefFor = (id: string) => pathname === "/" ? `#${id}` : `/#${id}`;

  return (
    <>
      <div className="topline">
        <div className="topline-inner">
          <span><strong>Offline first.</strong> Built for Kenya’s community health teams.</span>
          <div className="topline-contact">
            <a href="https://wa.me/254112272061" target="_blank" rel="noreferrer"><span aria-hidden="true">●</span> Talk to our team</a>
          </div>
        </div>
      </div>
      <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
        <div className="container nav-inner">
          <Brand />
          <nav className="site-nav" aria-label="Main navigation">
            {navItems.map(([label, id]) => <a key={id} href={hrefFor(id)}>{label}</a>)}
          </nav>
          <div className="nav-actions">
            <Link className="nav-signin" href="/sign-in">Sign In</Link>
            <Link className="btn btn-primary" href="/sign-up">Sign Up Free <ArrowUpRight aria-hidden="true" /></Link>
          </div>
          <button className="menu-toggle" type="button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <div className={`mobile-menu${menuOpen ? " is-open" : ""}`} aria-hidden={!menuOpen}>
        <div className="mobile-menu-head">
          <Brand />
          <button className="icon-button" type="button" aria-label="Close navigation" onClick={() => setMenuOpen(false)}><X /></button>
        </div>
        <nav className="mobile-menu-links" aria-label="Mobile navigation">
          {navItems.map(([label, id]) => <a key={id} href={hrefFor(id)} onClick={() => setMenuOpen(false)}>{label}</a>)}
        </nav>
        <div className="mobile-menu-actions">
          <Link className="btn btn-primary" href="/sign-up">Sign Up Free <ArrowUpRight /></Link>
          <Link className="btn btn-outline" href="/sign-in">Sign In</Link>
        </div>
      </div>
    </>
  );
}
