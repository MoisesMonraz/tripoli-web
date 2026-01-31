import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminSessionCookieName, verifyAdminSession } from "../../../../lib/security/adminSession";
import { getAdminDb } from "../../../../lib/security/adminAuth";
import { isRateLimited } from "../../../../lib/security/rateLimit";

const getClientIp = (request: Request) => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  return request.headers.get("x-real-ip") ?? "unknown";
};

export async function GET(request: Request) {
  const cookieName = getAdminSessionCookieName();
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;
  const session = verifyAdminSession(token);
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }
  const canReadLeads = ["owner", "admin", "editor"].includes(session.role);
  if (!canReadLeads) {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }

  const ip = getClientIp(request);
  const rateLimit = await isRateLimited({
    key: ip,
    max: 30,
    windowMs: 60_000,
    namespace: "admin-leads",
  });
  if (rateLimit.limited) {
    return NextResponse.json({ ok: false, error: "Too many requests." }, { status: 429 });
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ ok: false, error: "Firestore not initialized." }, { status: 500 });
  }

  try {
    const snapshot = await db
      .collection("leads")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();
    const leads = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return NextResponse.json({ ok: true, leads }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch leads.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
