import type { Metadata } from "next";
import { AppDashboard } from "@/components/app/AppDashboard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "CHW Field Workspace",
  description: "Offline-first patient records, visits, immunisations, and sync status.",
  robots: { index: false, follow: false },
};

export default function ChwAppPage() {
  return <AppDashboard />;
}
