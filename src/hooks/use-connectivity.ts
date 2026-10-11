"use client";

import { useEffect, useState } from "react";

export function useConnectivity() {
  const [online, setOnline] = useState(true);
  const [reconnected, setReconnected] = useState(false);

  useEffect(() => {
    setOnline(navigator.onLine);
    let timer = 0;
    const onOffline = () => {
      window.clearTimeout(timer);
      setReconnected(false);
      setOnline(false);
    };
    const onOnline = () => {
      setOnline(true);
      setReconnected(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setReconnected(false), 3000);
    };
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  return {
    online,
    showBanner: !online || reconnected,
    message: online ? "Back online. Syncing your data..." : "You are offline. Data is being saved locally.",
  };
}
