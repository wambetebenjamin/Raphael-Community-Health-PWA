import "server-only";

export type CaptchaVerification = {
  success: boolean;
  configured: boolean;
  score?: number;
  fallback?: "v2";
  message?: string;
};

export async function verifyRecaptcha(token: unknown, action: string, version: "v2" | "v3" = "v3"): Promise<CaptchaVerification> {
  const secret = version === "v2" ? process.env.RECAPTCHA_V2_SECRET_KEY : process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return { success: false, configured: false, message: "Online form protection is not configured." };
  if (typeof token !== "string" || token.length < 10 || token.length > 6000) {
    return { success: false, configured: true, message: "A valid security token is required." };
  }
  try {
    const body = new URLSearchParams({ secret, response: token });
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return { success: false, configured: true, message: "The security check is temporarily unavailable." };
    const result = await response.json() as { success?: boolean; score?: number; action?: string; "error-codes"?: string[] };
    if (!result.success) return { success: false, configured: true, message: "The security check was not accepted." };
    if (version === "v2") return { success: true, configured: true };
    if (result.action && result.action !== action) return { success: false, configured: true, message: "The security action did not match." };
    const score = typeof result.score === "number" ? result.score : 0;
    if (score < 0.5) return { success: false, configured: true, score, fallback: "v2", message: "Complete the security check to continue." };
    return { success: true, configured: true, score };
  } catch {
    return { success: false, configured: true, message: "The security check is temporarily unavailable." };
  }
}
