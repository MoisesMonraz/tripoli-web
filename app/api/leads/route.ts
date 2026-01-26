import { NextResponse } from "next/server";
import { db } from "../../../lib/firebase/server";

type LeadPayload = {
  __test?: boolean;
  name?: string;
  email?: string;
  phone?: string;
  service?: string;
  date?: string;
  time?: string;
};

export async function POST(request: Request) {
  if (request.method !== "POST") {
    return NextResponse.json({ ok: false, error: "Method not allowed." }, { status: 405 });
  }

  let body: LeadPayload | null = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const url = new URL(request.url);
  const isTest = url.searchParams.get("test") === "1" || Boolean(body?.__test);

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

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const service = typeof body.service === "string" ? body.service.trim() : "";
  const date = typeof body.date === "string" ? body.date.trim() : "";
  const time = typeof body.time === "string" ? body.time.trim() : "";

  if (!name || !email) {
    return NextResponse.json({ ok: false, error: "name and email are required." }, { status: 400 });
  }

  try {
    const docRef = await db.collection("leads").add({
      name,
      email,
      phone,
      service,
      date,
      time,
      source: "contact-agenda",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, id: docRef.id }, { status: 200 });
  } catch (error) {
    console.error("Firestore lead write failed:", error);
    const message = error instanceof Error ? error.message : "Failed to write lead.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
