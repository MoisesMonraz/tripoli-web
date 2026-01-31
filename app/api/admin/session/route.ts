import { NextResponse } from "next/server";
import { authenticator } from "otplib";
import { cookies } from "next/headers";
import { getAdminDb, verifyAdminIdToken } from "../../../../lib/security/adminAuth";
import { isRateLimited } from "../../../../lib/security/rateLimit";
import {
  createAdminSession,
  getAdminSessionCookieName,
  getAdminSessionTtlSeconds,
} from "../../../../lib/security/adminSession";

type SessionPayload = {
  idToken?: string;
  code?: string;
};

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

const normalizeCode = (code: string) => code.replace(/\s+/g, "");

export async function POST(request: Request) {
  if (request.method !== "POST") {
    return NextResponse.json({ ok: false, error: "Method not allowed." }, { status: 405 });
  }

  const originError = validateOrigin(request);
  if (originError) {
    return NextResponse.json({ ok: false, error: originError }, { status: 403 });
  }

  const ip = getClientIp(request);
  const rateLimit = await isRateLimited({
    key: ip,
    max: 10,
    windowMs: 60_000,
    namespace: "admin-session",
  });
  if (rateLimit.limited) {
    return NextResponse.json({ ok: false, error: "Too many requests." }, { status: 429 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json({ ok: false, error: "Content-Type must be application/json." }, { status: 415 });
  }

  let body: SessionPayload | null = null;
  try {
    body = (await request.json()) as SessionPayload;
  } catch {
    body = null;
  }

  const idToken = body?.idToken?.trim() ?? "";
  const code = body?.code ? normalizeCode(body.code) : "";
  if (!idToken || !code) {
    return NextResponse.json({ ok: false, error: "Missing idToken or code." }, { status: 400 });
  }

  try {
    const admin = await verifyAdminIdToken(idToken);
    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ ok: false, error: "Firestore not initialized." }, { status: 500 });
    }

    const docRef = db.collection("admin_users").doc(admin.uid);
    const snapshot = await docRef.get();
    if (!snapshot.exists) {
      return NextResponse.json({ ok: false, error: "MFA not setup." }, { status: 400 });
    }
    const data = snapshot.data() ?? {};
    const secret = typeof data.totpSecret === "string" ? data.totpSecret : "";
    const mfaEnabled = Boolean(data.mfaEnabled);
    if (!secret || !mfaEnabled) {
      return NextResponse.json({ ok: false, error: "MFA not setup." }, { status: 400 });
    }

    const isValid = authenticator.check(code, secret);
    if (!isValid) {
      return NextResponse.json({ ok: false, error: "Invalid code." }, { status: 403 });
    }

    const token = createAdminSession({
      uid: admin.uid,
      email: admin.email,
      role: admin.role,
    });
    if (!token) {
      return NextResponse.json({ ok: false, error: "Admin session not configured." }, { status: 500 });
    }

    const cookieName = getAdminSessionCookieName();
    const ttl = getAdminSessionTtlSeconds();
    const cookieStore = await cookies();
    cookieStore.set(cookieName, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: ttl,
      path: "/",
    });

    await docRef.set(
      {
        lastLoginAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true, role: admin.role, email: admin.email }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Session failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 403 });
  }
}
