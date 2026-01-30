import { NextResponse } from "next/server";
import { isRateLimited } from "../../../lib/security/rateLimit";
import { verifyTurnstileToken } from "../../../lib/security/turnstile";

const getClientIp = (request: Request) => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  return request.headers.get("x-real-ip") ?? "unknown";
};

const getRequestOrigin = (request: Request) => {
  const origin = request.headers.get("origin");
  if (origin) return origin;
  const referer = request.headers.get("referer");
  if (!referer) return null;
  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
};

const getAllowedOrigins = () => {
  const raw = process.env.ALLOWED_ORIGINS ?? "";
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const isValidWebhookToken = (request: Request, url: URL) => {
  const token = process.env.EMAIL_WEBHOOK_TOKEN;
  if (!token) return false;
  const provided =
    request.headers.get("x-email-webhook-token") ?? url.searchParams.get("webhook_token");
  return Boolean(provided) && provided === token;
};

const validateOrigin = (request: Request): string | null => {
  const allowed = getAllowedOrigins();
  if (allowed.length === 0) return null;
  const origin = getRequestOrigin(request);
  if (!origin) return "Missing Origin or Referer.";
  if (!allowed.includes(origin)) return "Origin not allowed.";
  return null;
};

/**
 * Email notification endpoint - Stub for Cal.com integration
 *
 * NOTE: Contact scheduling is handled via Cal.com booking widget.
 * This endpoint is kept for backwards compatibility or future email needs.
 * All booking data is automatically sent to Firebase via /api/leads.
 */

export async function POST(request: Request) {
  if (request.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
  }

  const url = new URL(request.url);
  const hasWebhookToken = isValidWebhookToken(request, url);
  const originError = hasWebhookToken ? null : validateOrigin(request);
  if (originError) {
    return NextResponse.json({ error: originError }, { status: 403 });
  }

  const ip = getClientIp(request);
  const rateLimit = await isRateLimited({
    key: ip,
    max: 12,
    windowMs: 60_000,
    namespace: "email",
  });
  if (rateLimit.limited) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!hasWebhookToken && !contentType.includes("application/json")) {
    return NextResponse.json({ error: "Content-Type must be application/json." }, { status: 415 });
  }

  let body: { email?: string; nombre?: string; captchaToken?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const nombre = typeof body?.nombre === "string" ? body.nombre.trim() : "";

  if (!email || !nombre) {
    return NextResponse.json({ error: "Email and nombre are required." }, { status: 400 });
  }

  if (!hasWebhookToken) {
    const captchaToken = body?.captchaToken ?? request.headers.get("x-captcha-token");
    const captchaResult = await verifyTurnstileToken(captchaToken ?? null, ip);
    if (!captchaResult.ok) {
      return NextResponse.json({ error: "Captcha verification failed." }, { status: 403 });
    }
  }

  try {
    // Log contact attempt (Cal.com handles actual scheduling)
    console.log("Contact notification (Cal.com active):", { email, nombre, timestamp: new Date().toISOString() });
    return NextResponse.json({ success: true, message: "Contact logged. Scheduling handled by Cal.com." }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to process email.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
