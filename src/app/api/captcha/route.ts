import { NextResponse } from "next/server";
import { safeJson, privateJsonHeaders } from "@/lib/server/api";
import { verifyRecaptcha } from "@/lib/server/recaptcha";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await safeJson(request, 8_000);
  if (!body || typeof body.action !== "string") {
    return NextResponse.json({ success: false, error: "invalid_request" }, { status: 400, headers: privateJsonHeaders });
  }
  const version = body.captchaVersion === "v2" ? "v2" : "v3";
  const result = await verifyRecaptcha(body.captchaToken, body.action, version);
  const status = result.success ? 200 : result.fallback ? 200 : result.configured ? 400 : 503;
  return NextResponse.json({ success: result.success, score: result.score, fallback: result.fallback, message: result.message }, { status, headers: privateJsonHeaders });
}
