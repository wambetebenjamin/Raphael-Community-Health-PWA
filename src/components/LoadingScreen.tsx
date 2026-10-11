"use client";

import { useEffect, useState } from "react";
import { Brand } from "@/components/Brand";

export function LoadingScreen() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setDone(true), reduced ? 0 : 650);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className={`loading-screen${done ? " is-done" : ""}`} aria-hidden={done}>
      <div className="loading-brand" role="status" aria-live="polite">
        <div className="loading-spinners" aria-hidden="true"><i /><i /><i /></div>
        <Brand compact />
        <span className="sr-only">Loading Raphael Community Health.</span>
      </div>
    </div>
  );
}
