import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { badRequest, privateJsonHeaders, safeJson, serviceUnavailable } from "@/lib/server/api";
import { kvCommand, kvConfigured } from "@/lib/server/kv";
import { verifyRecaptcha } from "@/lib/server/recaptcha";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await safeJson(request, 8_000);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return badRequest("Enter a valid email address.");
  if (body?.consent !== true) return badRequest("Consent to receive updates is required.");
  const captcha = await verifyRecaptcha(body?.captchaToken, "newsletter", body?.captchaVersion === "v2" ? "v2" : "v3");
  if (!captcha.success) {
    const status = captcha.fallback ? 403 : captcha.configured ? 400 : 503;
    return NextResponse.json({ error: "captcha_failed", message: captcha.message, fallback: captcha.fallback }, { status, headers: privateJsonHeaders });
  }
  if (!kvConfigured()) return serviceUnavailable("Newsletter storage is not configured yet.");
  const id = createHash("sha256").update(email).digest("hex");
  try {
    await kvCommand(["SET", `raphael:newsletter:${id}`, JSON.stringify({ email, consent: true, subscribedAt: new Date().toISOString() }), "NX"]);
    return NextResponse.json({ success: true, message: "You are subscribed to digital health updates." }, { headers: privateJsonHeaders });
  } catch {
    return serviceUnavailable("The subscription could not be saved. Please try again later.");
  }
}
