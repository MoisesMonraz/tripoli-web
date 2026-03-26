import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminSessionCookieName, verifyAdminSession } from '../../../../../lib/security/adminSession';
import { db } from '../../../../../lib/firebase/server';

// POST /api/admin/links/reorder — batch update order
// Body: { items: [{ id, order }] }
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(getAdminSessionCookieName())?.value;
  if (!verifyAdminSession(token)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  if (!db) return NextResponse.json({ error: 'DB not available.' }, { status: 503 });

  try {
    const { items } = await request.json() as { items: { id: string; order: number }[] };
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
    }
    const batch = db.batch();
    for (const item of items) {
      batch.update(db.collection('links').doc(item.id), { order: item.order });
    }
    await batch.commit();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[links reorder]', e);
    return NextResponse.json({ error: 'Error reordering links.' }, { status: 500 });
  }
}
