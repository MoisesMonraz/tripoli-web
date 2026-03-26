import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminSessionCookieName, verifyAdminSession } from '../../../../lib/security/adminSession';
import { db } from '../../../../lib/firebase/server';

function auth() {
  return cookies().then((store) => {
    const token = store.get(getAdminSessionCookieName())?.value;
    return verifyAdminSession(token);
  });
}

// GET /api/admin/links — list all links ordered by order asc
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getAdminSessionCookieName())?.value;
  if (!verifyAdminSession(token)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  if (!db) return NextResponse.json({ error: 'DB not available.' }, { status: 503 });

  try {
    const snap = await db.collection('links').orderBy('order', 'asc').get();
    const links = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ links });
  } catch (e) {
    console.error('[links GET]', e);
    return NextResponse.json({ error: 'Error fetching links.' }, { status: 500 });
  }
}

// POST /api/admin/links — create a new link
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(getAdminSessionCookieName())?.value;
  if (!verifyAdminSession(token)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  if (!db) return NextResponse.json({ error: 'DB not available.' }, { status: 503 });

  try {
    const body = await request.json();
    const { label, url, icon, active, order } = body;
    if (!label || !url || !icon) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }
    const ref = await db.collection('links').add({ label, url, icon, active: Boolean(active), order: Number(order) || 1 });
    return NextResponse.json({ id: ref.id });
  } catch (e) {
    console.error('[links POST]', e);
    return NextResponse.json({ error: 'Error creating link.' }, { status: 500 });
  }
}
