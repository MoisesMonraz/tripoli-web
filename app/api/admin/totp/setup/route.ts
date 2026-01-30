import { NextResponse } from "next/server";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import { getAdminDb, verifyAdminIdToken } from "../../../../../lib/security/adminAuth";
import { isRateLimited } from "../../../../../lib/security/rateLimit";

type SetupPayload = {
  idToken?: string;
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
    namespace: "admin-setup",
  });
  if (rateLimit.limited) {
    return NextResponse.json({ ok: false, error: "Too many requests." }, { status: 429 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json({ ok: false, error: "Content-Type must be application/json." }, { status: 415 });
  }

  let body: SetupPayload | null = null;
  try {
    body = (await request.json()) as SetupPayload;
  } catch {
    body = null;
  }

  const idToken = body?.idToken?.trim() ?? "";
  if (!idToken) {
    return NextResponse.json({ ok: false, error: "Missing idToken." }, { status: 400 });
  }

  try {
    const admin = await verifyAdminIdToken(idToken);
    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ ok: false, error: "Firestore not initialized." }, { status: 500 });
    }

    const docRef = db.collection("admin_users").doc(admin.uid);
    const snapshot = await docRef.get();
    if (snapshot.exists) {
      const data = snapshot.data() ?? {};
      if (data.totpSecret) {
        return NextResponse.json({
          ok: true,
          status: data.mfaEnabled ? "enabled" : "pending",
          email: admin.email,
          role: admin.role,
        });
      }
    }

    const secret = authenticator.generateSecret();
    const issuer = "Tripoli Media Admin";
    const otpauthUrl = authenticator.keyuri(admin.email, issuer, secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    await docRef.set(
      {
        uid: admin.uid,
        email: admin.email,
        role: admin.role,
        totpSecret: secret,
        mfaEnabled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return NextResponse.json({
      ok: true,
      status: "new",
      email: admin.email,
      role: admin.role,
      secret,
      otpauthUrl,
      qrCodeDataUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Setup failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 403 });
  }
}
