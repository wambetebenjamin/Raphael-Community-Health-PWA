import nodemailer from "nodemailer";
import { NextResponse } from "next/server";
import { badRequest, privateJsonHeaders, safeJson, serviceUnavailable } from "@/lib/server/api";
import { verifyRecaptcha } from "@/lib/server/recaptcha";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await safeJson(request, 12_000);
  if (!body) return badRequest("Enter a valid contact request.");
  const name = typeof body.name === "string" ? body.name.trim() : typeof body.contactName === "string" ? body.contactName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (name.length < 2 || name.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 5 || message.length > 3000) return badRequest("Check your name, email, and message.");
  if (body.consent !== true) return badRequest("Consent to be contacted is required.");
  const captcha = await verifyRecaptcha(body.captchaToken, "contact", body.captchaVersion === "v2" ? "v2" : "v3");
  if (!captcha.success) {
    const status = captcha.fallback ? 403 : captcha.configured ? 400 : 503;
    return NextResponse.json({ error: "captcha_failed", message: captcha.message, fallback: captcha.fallback }, { status, headers: privateJsonHeaders });
  }
  const host = process.env.SMTP_HOST;
  const from = process.env.CONTACT_EMAIL_FROM;
  const to = process.env.CONTACT_EMAIL_TO;
  if (!host || !from || !to) return serviceUnavailable("Email delivery is not configured yet. Please contact the team through WhatsApp.");
  try {
    const port = Number(process.env.SMTP_PORT || 587);
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: process.env.SMTP_SECURE === "true" || port === 465,
      auth: process.env.SMTP_USER && process.env.SMTP_PASSWORD
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
    });
    await transporter.sendMail({
      from,
      to,
      replyTo: email,
      subject: "Raphael Community Health enquiry",
      text: `Name: ${name}\nEmail: ${email}\n\n${message}\n\nDo not include patient health information in public enquiries.`,
    });
    return NextResponse.json({ success: true, message: "Your message was sent securely." }, { headers: privateJsonHeaders });
  } catch {
    return serviceUnavailable("The contact email could not be sent right now.");
  }
}
