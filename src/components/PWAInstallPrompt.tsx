"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Brand } from "@/components/Brand";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PWAInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    if (standalone || localStorage.getItem("rchw-pwa-install-dismissed") === "1") return;
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent));

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setShow(false);
      localStorage.setItem("rchw-pwa-installed", "1");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    const timer = window.setTimeout(() => {
      if (localStorage.getItem("rchw-pwa-install-dismissed") !== "1") setShow(true);
    }, 30_000);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem("rchw-pwa-install-dismissed", "1");
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") localStorage.setItem("rchw-pwa-installed", "1");
    setInstallEvent(null);
    setShow(false);
  };

  if (!show) return null;
  return (
    <aside className="install-prompt" aria-label="Install Raphael Community Health">
      <Brand href="/app" compact />
      <div className="install-prompt-copy">
        <strong>Add to Home Screen</strong>
        <p>{isIOS ? "Tap Share, then choose Add to Home Screen." : "Keep your field workspace one tap away, even without a browser tab."}</p>
        <div className="install-prompt-actions">
          {installEvent && <button className="btn btn-primary" type="button" onClick={install}><Download /> Install app</button>}
          {!installEvent && !isIOS && <a className="btn btn-outline" href="/app">Open app</a>}
        </div>
      </div>
      <button className="install-close" type="button" aria-label="Dismiss install prompt" onClick={dismiss}><X /></button>
    </aside>
  );
}
