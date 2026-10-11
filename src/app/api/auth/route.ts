import { NextResponse } from "next/server";
import type { CountyName } from "@/lib/types";
import { attachSessionCookie, clearSessionCookie, createAccount, createSessionToken, getAccount, getSession, hashPin, verifyPin, type ChwAccount } from "@/lib/server/auth";
import { safeJson, serviceUnavailable, privateJsonHeaders } from "@/lib/server/api";
import { kvConfigured } from "@/lib/server/kv";
import { verifyRecaptcha } from "@/lib/server/recaptcha";

export const dynamic = "force-dynamic";
const counties: CountyName[] = ["Turkana", "Kisii", "Kajiado", "Kilifi", "Tana River"];
const privateHeaders = privateJsonHeaders;

export async function GET(request: Request) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ authenticated: false, profile: null }, { headers: privateHeaders });
  try {
    const account = await getAccount(session.sub);
    return NextResponse.json({
      authenticated: Boolean(account),
      profile: account ? { fullName: account.fullName, chwId: account.id, county: account.county, subCounty: account.subCounty, ward: account.ward, email: account.email, phone: account.phone, role: account.role } : null,
    }, { headers: privateHeaders });
  } catch {
    return NextResponse.json({ authenticated: false, profile: null }, { status: 503, headers: privateHeaders });
  }
}

export async function POST(request: Request) {
  const body = await safeJson(request, 16_000);
  if (!body) return NextResponse.json({ error: "invalid_request", message: "Enter valid account details." }, { status: 400, headers: privateHeaders });
  if (!kvConfigured() || !process.env.RCHW_SESSION_SECRET || process.env.RCHW_SESSION_SECRET.length < 32) {
    return serviceUnavailable("Secure account storage is not configured. Ask the deployment administrator before entering real information.");
  }
  const action = body.action === "register" ? "register" : body.action === "sign-in" ? "sign-in" : null;
  if (!action) return NextResponse.json({ error: "invalid_request", message: "Choose register or sign in." }, { status: 400, headers: privateHeaders });

  let account: ChwAccount | null = null;
  if (action === "register") {
    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
    const id = typeof body.chwId === "string" ? body.chwId.trim().toUpperCase() : "";
    const county = typeof body.county === "string" ? body.county : "";
    const subCounty = typeof body.subCounty === "string" ? body.subCounty.trim() : "";
    const ward = typeof body.ward === "string" ? body.ward.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const pin = typeof body.pin === "string" ? body.pin : "";
    if (body.consent !== true || fullName.length < 2 || fullName.length > 100 || !/^[A-Z0-9_-]{3,32}$/.test(id) || !counties.includes(county as CountyName) || !subCounty || !ward || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || pin.length < 6 || pin.length > 12) {
      return NextResponse.json({ error: "invalid_request", message: "Check the CHW ID, county, contact details, and PIN." }, { status: 400, headers: privateHeaders });
    }
    const captcha = await verifyRecaptcha(body.captchaToken, "register", body.captchaVersion === "v2" ? "v2" : "v3");
    if (!captcha.success) {
      const status = captcha.fallback ? 403 : captcha.configured ? 400 : 503;
      return NextResponse.json({ error: "captcha_failed", message: captcha.message, fallback: captcha.fallback }, { status, headers: privateHeaders });
    }
    const pinHash = await hashPin(pin);
    account = {
      id,
      fullName,
      county: county as CountyName,
      subCounty,
      ward,
      email,
      phone,
      ...pinHash,
      role: "chw",
      createdAt: new Date().toISOString(),
    };
    try {
      const created = await createAccount(account);
      if (!created) return NextResponse.json({ error: "account_exists", message: "That CHW ID is already registered. Sign in or contact your county administrator." }, { status: 409, headers: privateHeaders });
    } catch {
      return serviceUnavailable("The account could not be saved. Check the county storage configuration and try again later.");
    }
  } else {
    const id = typeof body.chwId === "string" ? body.chwId.trim().toUpperCase() : "";
    const pin = typeof body.pin === "string" ? body.pin : "";
    if (!id || pin.length < 6) return NextResponse.json({ error: "invalid_request", message: "Enter your CHW ID and PIN." }, { status: 400, headers: privateHeaders });
    try {
      account = await getAccount(id);
      if (!account || !(await verifyPin(pin, account.pinSalt, account.pinHash))) {
        return NextResponse.json({ error: "invalid_credentials", message: "The CHW ID or PIN was not recognised." }, { status: 401, headers: privateHeaders });
      }
    } catch {
      return serviceUnavailable("The account service is temporarily unavailable.");
    }
  }

  try {
    const response = NextResponse.json({
      success: true,
      message: action === "register" ? "Your CHW account is ready." : "You are signed in.",
      profile: { fullName: account.fullName, chwId: account.id, county: account.county, subCounty: account.subCounty, ward: account.ward },
    }, { headers: privateHeaders });
    attachSessionCookie(response, createSessionToken(account));
    return response;
  } catch {
    return serviceUnavailable("Secure sign-in is not configured. Ask the deployment administrator.");
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: "You have signed out." }, { headers: privateHeaders });
  clearSessionCookie(response);
  return response;
}
