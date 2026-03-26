import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminSessionCookieName, verifyAdminSession } from '../../../../../lib/security/adminSession';
import { db } from '../../../../../lib/firebase/server';

// PATCH /api/admin/links/[id] — update fields
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(getAdminSessionCookieName())?.value;
  if (!verifyAdminSession(token)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  if (!db) return NextResponse.json({ error: 'DB not available.' }, { status: 503 });

  try {
    const { id } = await params;
    const body = await request.json();
    await db.collection('links').doc(id).update(body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[links PATCH]', e);
    return NextResponse.json({ error: 'Error updating link.' }, { status: 500 });
  }
}

// DELETE /api/admin/links/[id] — delete a link
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(getAdminSessionCookieName())?.value;
  if (!verifyAdminSession(token)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  if (!db) return NextResponse.json({ error: 'DB not available.' }, { status: 503 });

  try {
    const { id } = await params;
    await db.collection('links').doc(id).delete();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[links DELETE]', e);
    return NextResponse.json({ error: 'Error deleting link.' }, { status: 500 });
  }
}
