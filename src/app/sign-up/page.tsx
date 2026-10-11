import type { Metadata } from "next";
import { AuthShell } from "@/components/AuthShell";
import { SignUpForm } from "@/components/AuthForms";

export const metadata: Metadata = { title: "Register as a CHW", description: "Create an offline-ready workspace for a Kenyan community health worker.", robots: { index: false, follow: false } };

export default function SignUpPage() {
  return <AuthShell signUp><SignUpForm /></AuthShell>;
}
