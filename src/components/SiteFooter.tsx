import Link from "next/link";
import { ArrowUpRight, HeartPulse, MapPin, MessageCircle } from "lucide-react";
import { Brand } from "@/components/Brand";

const whatsapp = "https://wa.me/254112272061?text=Hello!%20I%20am%20interested%20in%20Raphael%20Community%20Health%20for%20my%20county%20or%20organisation.";

export function SiteFooter() {
  return (
    <footer className="site-footer" id="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-about">
            <Brand />
            <p>Offline-ready digital health records for community health workers and the county teams who support them.</p>
            <Link className="text-link" href="/sign-up">Join the field network <ArrowUpRight /></Link>
          </div>
          <div className="footer-column">
            <h3>Platform</h3>
            <a href="/#features">Features</a>
            <a href="/#counties">Counties</a>
            <a href="/#pricing">Pricing</a>
            <a href="/#about">How offline sync works</a>
            <Link href="/app">Open CHW workspace</Link>
          </div>
          <div className="footer-column">
            <h3>Resources</h3>
            <Link href="/legal/privacy-policy">Privacy and patient data</Link>
            <Link href="/legal/terms">Terms of use</Link>
            <Link href="/legal/cookie-policy">Cookie policy</Link>
            <a href="/#compliance">MOH reporting note</a>
            <a href="/counties/turkana">County information</a>
          </div>
          <div className="footer-column">
            <h3>Talk to us</h3>
            <div className="footer-contact">
              <a href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle /><span>County partnerships and CHW registration</span></a>
              <a href="/sign-up"><HeartPulse /><span>Register as a community health worker</span></a>
              <a href="/#counties"><MapPin /><span>Turkana, Kisii, Kajiado, Kilifi, Tana River</span></a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Raphael Community Health. Made for community care.</span>
          <span>Patient data is sensitive personal data. County approval and configuration are required before live clinical use.</span>
          <span className="footer-credit">Color and typography reference: <a href="https://htmlcodex.com/dental-clinic-website-template/" target="_blank" rel="noreferrer">DentCare by HTML Codex</a>, CC BY 4.0.</span>
        </div>
      </div>
    </footer>
  );
}
