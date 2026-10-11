import Link from "next/link";
import { ArrowLeft, CloudOff, HeartPulse } from "lucide-react";

export default function NotFound() {
  return (
    <main id="main-content" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#EEF9FF", color: "#091E3E" }}>
      <section style={{ width: "min(100%, 520px)", padding: 34, border: "1px solid #D9E5EA", borderRadius: 24, background: "#fff", boxShadow: "0 16px 44px rgba(9,30,62,.12)" }}>
        <span style={{ display: "grid", width: 50, height: 50, placeItems: "center", borderRadius: 15, background: "#E4F5FA", color: "#07536C" }}><HeartPulse /></span>
        <p style={{ margin: "22px 0 9px", color: "#07536C", fontSize: 12, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase" }}>Page not found</p>
        <h1 style={{ margin: 0, fontFamily: "Jost, Arial, sans-serif", fontSize: 34, lineHeight: 1.15 }}>This page could not be found.</h1>
        <p style={{ margin: "12px 0 24px", color: "#526477", fontSize: 16 }}>The page may have moved, but your field workspace is still available.</p>
        <Link href="/app" style={{ display: "inline-flex", minHeight: 52, alignItems: "center", gap: 9, padding: "0 18px", borderRadius: 12, background: "#07536C", color: "#fff", fontFamily: "Jost, Arial, sans-serif", fontSize: 14, fontWeight: 700 }}><ArrowLeft size={17} /> Return to Dashboard</Link>
        <p style={{ display: "flex", alignItems: "center", gap: 7, margin: "18px 0 0", color: "#526477", fontSize: 12 }}><CloudOff size={15} /> The dashboard is designed to open offline after its first visit.</p>
      </section>
    </main>
  );
}
