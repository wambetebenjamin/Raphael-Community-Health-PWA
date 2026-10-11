import type { Metadata } from "next";
import { AuthShell } from "@/components/AuthShell";
import { SignInForm } from "@/components/AuthForms";

export const metadata: Metadata = { title: "Sign In", robots: { index: false, follow: false } };

export default function SignInPage() {
  return <AuthShell><SignInForm /></AuthShell>;
}
