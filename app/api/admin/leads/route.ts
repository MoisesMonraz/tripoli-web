import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminSessionCookieName, verifyAdminSession } from "../../../../lib/security/adminSession";
import { auth } from "../../../../lib/firebase/server";
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

  if (!auth) {
    return NextResponse.json({ ok: false, error: "Firebase Auth not initialized." }, { status: 500 });
  }

  try {
    const listUsersResult = await auth.listUsers({
      maxResults: 100,
    });

    // Sort by creation time desc
    const users = listUsersResult.users.sort((a, b) => {
      const dateA = new Date(a.metadata.creationTime).getTime();
      const dateB = new Date(b.metadata.creationTime).getTime();
      return dateB - dateA;
    });

    const leads = users.map((user) => ({
      id: user.uid,
      email: user.email,
      name: user.displayName,
      photo: user.photoURL,
      provider: user.providerData.map((p) => p.providerId).join(", "),
      createdAt: user.metadata.creationTime,
      lastLogin: user.metadata.lastSignInTime,
    }));

    return NextResponse.json({ ok: true, leads, total: leads.length }, { status: 200 });
  } catch (error) {
    console.error("Failed to list users:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch users.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
