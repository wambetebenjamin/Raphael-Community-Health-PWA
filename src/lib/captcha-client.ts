declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
      render?: (container: HTMLElement, options: Record<string, unknown>) => number;
      reset?: (widgetId?: number) => void;
    };
  }
}

let scriptPromise: Promise<void> | null = null;

async function loadRecaptcha(siteKey: string, explicit = false) {
  if (typeof window === "undefined") return;
  if (window.grecaptcha?.ready) return;
  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>("script[data-rch-recaptcha]");
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("reCAPTCHA could not load.")), { once: true });
        if (window.grecaptcha?.ready) resolve();
        return;
      }
      const script = document.createElement("script");
      script.dataset.rchRecaptcha = "true";
      script.src = explicit
        ? `https://www.google.com/recaptcha/api.js?render=explicit`
        : `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("reCAPTCHA could not load."));
      document.head.appendChild(script);
    });
  }
  await Promise.race([
    scriptPromise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("reCAPTCHA timed out.")), 8_000)),
  ]);
}

export async function getRecaptchaToken(action: string): Promise<string | null> {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!siteKey || typeof window === "undefined" || !navigator.onLine) return null;
  await loadRecaptcha(siteKey);
  return new Promise((resolve, reject) => {
    window.grecaptcha?.ready(() => {
      window.grecaptcha?.execute(siteKey, { action }).then(resolve).catch(reject);
    });
  });
}

export async function renderRecaptchaV2(
  container: HTMLElement,
  onToken: (token: string) => void,
  onExpired?: () => void,
) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_V2_SITE_KEY;
  if (!siteKey) throw new Error("A reCAPTCHA v2 site key is not configured.");
  await loadRecaptcha(siteKey, true);
  if (!window.grecaptcha?.render) throw new Error("The reCAPTCHA fallback could not be loaded.");
  return window.grecaptcha.render(container, {
    sitekey: siteKey,
    callback: onToken,
    "expired-callback": onExpired,
    theme: "light",
  });
}
