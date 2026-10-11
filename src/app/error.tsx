"use client";

import Link from "next/link";
import { CloudOff, HeartPulse } from "lucide-react";

export default function ErrorPage() {
  return (
    <main id="main-content" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#EEF9FF", color: "#091E3E" }}>
      <section style={{ width: "min(100%, 520px)", padding: 34, border: "1px solid #D9E5EA", borderRadius: 24, background: "#fff", boxShadow: "0 16px 44px rgba(9,30,62,.12)" }} role="status">
        <span style={{ display: "grid", width: 50, height: 50, placeItems: "center", borderRadius: 15, background: "#E4F5FA", color: "#07536C" }}><HeartPulse /></span>
        <p style={{ margin: "22px 0 9px", color: "#9A3D23", fontSize: 12, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase" }}>Service status</p>
        <h1 style={{ margin: 0, fontFamily: "Jost, Arial, sans-serif", fontSize: 31, lineHeight: 1.18 }}>Server temporarily unavailable.</h1>
        <p style={{ margin: "12px 0 7px", color: "#526477", fontSize: 16 }}>The app continues to work offline.</p>
        <p style={{ margin: "0 0 23px", color: "#526477", fontSize: 16 }}>Your data will sync when the server is back.</p>
        <Link href="/app" style={{ display: "inline-flex", minHeight: 52, alignItems: "center", gap: 9, padding: "0 18px", borderRadius: 12, background: "#07536C", color: "#fff", fontFamily: "Jost, Arial, sans-serif", fontSize: 14, fontWeight: 700 }}><CloudOff size={17} /> Continue in offline workspace</Link>
      </section>
    </main>
  );
}
