import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminSessionCookieName } from "../../../../lib/security/adminSession";

export async function POST() {
  const cookieName = getAdminSessionCookieName();
  const cookieStore = await cookies();
  cookieStore.set(cookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
  return NextResponse.json({ ok: true }, { status: 200 });
}
