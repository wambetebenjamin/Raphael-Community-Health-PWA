import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { badRequest, safeJson, serviceUnavailable, privateJsonHeaders } from "@/lib/server/api";
import { kvCommand, kvConfigured } from "@/lib/server/kv";
import { verifyRecaptcha } from "@/lib/server/recaptcha";

export const dynamic = "force-dynamic";
const allowedCounties = new Set(["Turkana", "Kisii", "Kajiado", "Kilifi", "Tana River"]);

export async function POST(request: Request) {
  const body = await safeJson(request, 16_000);
  if (!body) return badRequest("Enter valid enquiry details.");
  const organisation = typeof body.organisation === "string" ? body.organisation.trim() : "";
  const county = typeof body.county === "string" ? body.county : "";
  const contactName = typeof body.contactName === "string" ? body.contactName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const chwCount = typeof body.chwCount === "string" ? body.chwCount : "";
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 1800) : "";
  if (organisation.length < 2 || organisation.length > 160 || !allowedCounties.has(county) || contactName.length < 2 || contactName.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || phone.length < 7 || phone.length > 24 || !chwCount) return badRequest("Check the organisation, county, contact, email, phone, and CHW count fields.");
  if (body.consent !== true) return badRequest("Consent to be contacted is required.");
  const captcha = await verifyRecaptcha(body.captchaToken, "partnership", body.captchaVersion === "v2" ? "v2" : "v3");
  if (!captcha.success) {
    const status = captcha.fallback ? 403 : captcha.configured ? 400 : 503;
    return NextResponse.json({ error: "captcha_failed", message: captcha.message, fallback: captcha.fallback }, { status, headers: privateJsonHeaders });
  }
  if (!kvConfigured()) return serviceUnavailable("Partnership enquiry storage is not configured yet. Please contact us on WhatsApp.");
  const id = randomUUID();
  const enquiry = {
    id,
    organisation,
    county,
    contactName,
    email,
    phone,
    chwCount,
    message,
    createdAt: new Date().toISOString(),
    consent: true,
  };
  try {
    await kvCommand(["SET", `raphael:partnership:${id}`, JSON.stringify(enquiry), "EX", 60 * 60 * 24 * 365]);
    await kvCommand(["SADD", "raphael:partnership:ids", id]);
  } catch {
    return serviceUnavailable("The enquiry could not be saved. Please contact us on WhatsApp.");
  }

  let notificationSent = false;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const alertPhone = process.env.WHATSAPP_ALERT_PHONE;
  if (token && phoneNumberId && alertPhone) {
    try {
      const version = process.env.WHATSAPP_API_VERSION || "v22.0";
      const response = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: alertPhone,
          type: "text",
          text: { body: `New Raphael Community Health partnership enquiry: ${organisation}, ${county}, ${chwCount} CHWs. Contact ${contactName} at ${email} or ${phone}. Reference ${createHash("sha256").update(id).digest("hex").slice(0, 10)}.` },
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(8_000),
      });
      notificationSent = response.ok;
    } catch {
      notificationSent = false;
    }
  }
  return NextResponse.json({ success: true, message: notificationSent ? "Enquiry saved. The county partnerships team has been notified." : "Enquiry saved. Our team will follow up using your contact details." }, { status: 201, headers: privateJsonHeaders });
}
