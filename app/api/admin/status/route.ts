import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminSessionCookieName, verifyAdminSession } from "../../../../lib/security/adminSession";

export async function GET() {
  const cookieName = getAdminSessionCookieName();
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;
  const session = verifyAdminSession(token);
  if (!session) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    email: session.email,
    role: session.role,
  });
}
