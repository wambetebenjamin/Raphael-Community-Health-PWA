"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    let registration: ServiceWorkerRegistration | undefined;
    navigator.serviceWorker.register("/sw.js", { scope: "/" })
      .then((value) => {
        registration = value;
        value.update().catch(() => undefined);
      })
      .catch(() => undefined);
    return () => {
      registration?.active?.postMessage({ type: "NOOP" });
    };
  }, []);

  return null;
}
