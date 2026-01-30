import { NextResponse } from "next/server";
import { db } from "../../../lib/firebase/server";
import { isRateLimited } from "../../../lib/security/rateLimit";
import { verifyTurnstileToken } from "../../../lib/security/turnstile";

type LeadPayload = {
  __test?: boolean;
  name?: string;
  email?: string;
  phone?: string;
  service?: string;
  date?: string;
  time?: string;
  message?: string;
  captchaToken?: string | null;
};

/**
 * Email validation regex (RFC 5322 simplified)
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Phone validation (flexible international format)
 */
const PHONE_REGEX = /^[+]?[0-9\s\-\(\)]{7,20}$/;

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
  const token = process.env.LEADS_WEBHOOK_TOKEN;
  if (!token) return false;
  const provided =
    request.headers.get("x-leads-webhook-token") ?? url.searchParams.get("webhook_token");
  return Boolean(provided) && provided === token;
};

const isValidTestToken = (request: Request, url: URL) => {
  const token = process.env.LEADS_TEST_TOKEN;
  if (!token) return false;
  const provided =
    request.headers.get("x-leads-test-token") ?? url.searchParams.get("test_token");
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
 * Validation constraints
 */
const CONSTRAINTS = {
  name: { min: 2, max: 100 },
  email: { min: 5, max: 100 },
  phone: { min: 7, max: 20 },
  service: { min: 0, max: 200 },
  message: { min: 0, max: 5000 },
} as const;

/**
 * Sanitize string input (prevent XSS)
 */
function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 5000); // Hard limit
}

/**
 * Validate string length
 */
function validateLength(value: string, field: keyof typeof CONSTRAINTS): boolean {
  const { min, max } = CONSTRAINTS[field];
  return value.length >= min && value.length <= max;
}

export async function POST(request: Request) {
  if (request.method !== "POST") {
    return NextResponse.json({ ok: false, error: "Method not allowed." }, { status: 405 });
  }

  if (!db) {
    return NextResponse.json({ ok: false, error: "Firestore not initialized." }, { status: 500 });
  }

  const url = new URL(request.url);
  const isTestQuery = url.searchParams.get("test") === "1";
  const hasWebhookToken = isValidWebhookToken(request, url);
  const hasTestToken = isTestQuery && isValidTestToken(request, url);
  const originError = hasWebhookToken || hasTestToken ? null : validateOrigin(request);
  if (originError) {
    return NextResponse.json({ ok: false, error: originError }, { status: 403 });
  }

  const ip = getClientIp(request);
  const rateLimit = await isRateLimited({
    key: ip,
    max: 12,
    windowMs: 60_000,
    namespace: "leads",
  });
  if (rateLimit.limited) {
    return NextResponse.json({ ok: false, error: "Too many requests. Try again later." }, { status: 429 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!isTestQuery && !hasWebhookToken && !contentType.includes("application/json")) {
    return NextResponse.json({ ok: false, error: "Content-Type must be application/json." }, { status: 415 });
  }

  let body: LeadPayload | null = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const isTest = isTestQuery || Boolean(body?.__test);
  if (isTest) {
    if (!isValidTestToken(request, url)) {
      return NextResponse.json({ ok: false, error: "Test mode not authorized." }, { status: 403 });
    }
  }

  if (!isTest && !hasWebhookToken) {
    const captchaToken = body?.captchaToken ?? request.headers.get("x-captcha-token");
    const captchaResult = await verifyTurnstileToken(captchaToken ?? null, ip);
    if (!captchaResult.ok) {
      return NextResponse.json({ ok: false, error: "Captcha verification failed." }, { status: 403 });
    }
  }

  if (isTest) {
    try {
      const docRef = await db.collection("leads").add({
        test: "escritura-forzada",
        createdAt: new Date().toISOString(),
      });
      return NextResponse.json({ ok: true, id: docRef.id }, { status: 200 });
    } catch (error) {
      console.error("Firestore test write failed:", error);
      const message = error instanceof Error ? error.message : "Failed to write test lead.";
      return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  // Sanitize and extract fields
  const name = typeof body.name === "string" ? sanitizeString(body.name) : "";
  const email = typeof body.email === "string" ? sanitizeString(body.email).toLowerCase() : "";
  const phone = typeof body.phone === "string" ? sanitizeString(body.phone) : "";
  const service = typeof body.service === "string" ? sanitizeString(body.service) : "";
  const date = typeof body.date === "string" ? sanitizeString(body.date) : "";
  const time = typeof body.time === "string" ? sanitizeString(body.time) : "";
  const message = typeof body.message === "string" ? sanitizeString(body.message) : "";

  // Validate required fields
  if (!name || !email) {
    return NextResponse.json({ ok: false, error: "name and email are required." }, { status: 400 });
  }

  // Validate name length
  if (!validateLength(name, "name")) {
    return NextResponse.json({
      ok: false,
      error: `name must be between ${CONSTRAINTS.name.min} and ${CONSTRAINTS.name.max} characters.`
    }, { status: 400 });
  }

  // Validate email format
  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ ok: false, error: "Invalid email format." }, { status: 400 });
  }

  // Validate email length
  if (!validateLength(email, "email")) {
    return NextResponse.json({
      ok: false,
      error: `email must be between ${CONSTRAINTS.email.min} and ${CONSTRAINTS.email.max} characters.`
    }, { status: 400 });
  }

  // Validate phone format (if provided)
  if (phone && !PHONE_REGEX.test(phone)) {
    return NextResponse.json({ ok: false, error: "Invalid phone format." }, { status: 400 });
  }

  // Validate service length (if provided)
  if (service && !validateLength(service, "service")) {
    return NextResponse.json({
      ok: false,
      error: `service must be at most ${CONSTRAINTS.service.max} characters.`
    }, { status: 400 });
  }

  // Validate message length (if provided)
  if (message && !validateLength(message, "message")) {
    return NextResponse.json({
      ok: false,
      error: `message must be at most ${CONSTRAINTS.message.max} characters.`
    }, { status: 400 });
  }

  try {
    // Prepare lead document
    const leadData: Record<string, any> = {
      name,
      email,
      source: "contact-agenda",
      createdAt: new Date().toISOString(),
    };

    // Add optional fields only if provided
    if (phone) leadData.phone = phone;
    if (service) leadData.service = service;
    if (date) leadData.date = date;
    if (time) leadData.time = time;
    if (message) leadData.message = message;

    const docRef = await db.collection("leads").add(leadData);

    console.log("Lead captured successfully:", { id: docRef.id, email });

    return NextResponse.json({ ok: true, id: docRef.id }, { status: 200 });
  } catch (error) {
    console.error("Firestore lead write failed:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to write lead.";
    return NextResponse.json({ ok: false, error: errorMessage }, { status: 500 });
  }
}
