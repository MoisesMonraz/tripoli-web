import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../../../../lib/firebase/server";
import { isRateLimited } from "../../../../lib/security/rateLimit";
import { verifyTurnstileToken } from "../../../../lib/security/turnstile";

type GuestLeadPayload = {
  email?: string;
  ipLocation?: Record<string, unknown> | null;
  captchaToken?: string | null;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

const validateOrigin = (request: Request): string | null => {
  const allowed = getAllowedOrigins();
  if (allowed.length === 0) return null;
  const origin = getRequestOrigin(request);
  if (!origin) return "Missing Origin or Referer.";
  if (!allowed.includes(origin)) return "Origin not allowed.";
  return null;
};

const sanitizeIpLocation = (input: unknown) => {
  if (!input || typeof input !== "object") return null;
  const data = input as Record<string, unknown>;
  const payload: Record<string, unknown> = {};

  if (typeof data.ip === "string") payload.ip = data.ip;
  if (typeof data.city === "string") payload.city = data.city;
  if (typeof data.region === "string") payload.region = data.region;
  if (typeof data.country === "string") payload.country = data.country;
  if (typeof data.timezone === "string") payload.timezone = data.timezone;
  if (typeof data.source === "string") payload.source = data.source;
  if (typeof data.latitude === "number") payload.latitude = data.latitude;
  if (typeof data.longitude === "number") payload.longitude = data.longitude;

  return Object.keys(payload).length > 0 ? payload : null;
};

export async function POST(request: Request) {
  if (request.method !== "POST") {
    return NextResponse.json({ ok: false, error: "Method not allowed." }, { status: 405 });
  }

  if (!db) {
    return NextResponse.json({ ok: false, error: "Firestore not initialized." }, { status: 500 });
  }

  const originError = validateOrigin(request);
  if (originError) {
    return NextResponse.json({ ok: false, error: originError }, { status: 403 });
  }

  const ip = getClientIp(request);
  const rateLimit = await isRateLimited({
    key: ip,
    max: 12,
    windowMs: 60_000,
    namespace: "access-gate",
  });
  if (rateLimit.limited) {
    return NextResponse.json({ ok: false, error: "Too many requests. Try again later." }, { status: 429 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json({ ok: false, error: "Content-Type must be application/json." }, { status: 415 });
  }

  let body: GuestLeadPayload | null = null;
  try {
    body = (await request.json()) as GuestLeadPayload;
  } catch {
    body = null;
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ ok: false, error: "Invalid email format." }, { status: 400 });
  }

  const captchaToken = body.captchaToken ?? request.headers.get("x-captcha-token");
  const captchaResult = await verifyTurnstileToken(captchaToken ?? null, ip);
  if (!captchaResult.ok) {
    return NextResponse.json({ ok: false, error: "Captcha verification failed." }, { status: 403 });
  }

  const ipLocation = sanitizeIpLocation(body.ipLocation);

  try {
    const payload = {
      email,
      ip_location: ipLocation ?? null,
      acceptedTermsAt: FieldValue.serverTimestamp(),
      marketingConsent: false,
      isGuest: true,
    };

    const docRef = await db.collection("guest_leads_db").add(payload);
    return NextResponse.json({ ok: true, id: docRef.id }, { status: 200 });
  } catch (error) {
    console.error("Guest lead write failed:", error);
    const message = error instanceof Error ? error.message : "Failed to save guest lead.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
