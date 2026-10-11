"use client";

import Link from "next/link";
import { CloudOff } from "lucide-react";

export default function GlobalError() {
  return (
    <html lang="en-KE">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#EEF9FF", color: "#091E3E", fontFamily: "Arial, sans-serif" }}>
        <main role="status" style={{ width: "min(100%, 520px)", padding: 34, border: "1px solid #D9E5EA", borderRadius: 24, background: "#fff", boxShadow: "0 16px 44px rgba(9,30,62,.12)" }}>
          <h1 style={{ margin: 0, fontSize: 30 }}>Server temporarily unavailable.</h1>
          <p style={{ margin: "14px 0 6px", fontSize: 16, lineHeight: 1.6 }}>The app continues to work offline.</p>
          <p style={{ margin: "0 0 22px", fontSize: 16, lineHeight: 1.6 }}>Your data will sync when the server is back.</p>
          <Link href="/app" style={{ display: "inline-flex", minHeight: 50, alignItems: "center", gap: 9, padding: "0 17px", borderRadius: 11, background: "#07536C", color: "#fff", fontWeight: 700, textDecoration: "none" }}><CloudOff size={17} /> Continue in offline workspace</Link>
        </main>
      </body>
    </html>
  );
}
