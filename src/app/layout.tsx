import type { Metadata, Viewport } from "next";
import "@fontsource/jost/500.css";
import "@fontsource/jost/600.css";
import "@fontsource/jost/700.css";
import "@fontsource/open-sans/400.css";
import "@fontsource/open-sans/600.css";
import "./globals.css";
import { CookieConsent } from "@/components/CookieConsent";
import { LoadingScreen } from "@/components/LoadingScreen";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { PublicQueueSync } from "@/components/PublicQueueSync";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://raphaelhealth.co.ke";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Raphael Community Health",
  title: {
    default: "Raphael Community Health",
    template: "%s | Raphael Community Health",
  },
  description: "Offline health records for Kenya community health workers.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Raphael Health",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#06A3DA",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-KE">
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <ServiceWorkerRegistration />
        <PublicQueueSync />
        <LoadingScreen />
        {children}
        <CookieConsent />
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
