import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (request.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
  }

  let body: { email?: string; nombre?: string };
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

  try {
    console.log("Email stubbed:", { email, nombre });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to process email.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
