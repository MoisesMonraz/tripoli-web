import { NextRequest, NextResponse } from 'next/server';

const ADMIN_COOKIE = 'tripoli_admin_session';

function base64UrlDecode(input: string): string {
  const padded =
    input.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((input.length + 3) % 4);
  return atob(padded);
}

function uint8ArrayToBase64Url(arr: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < arr.length; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function verifyAdminSession(token: string): Promise<boolean> {
  const secret =
    process.env.ADMIN_SESSION_SECRET ||
    process.env.SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    '';
  if (!secret || !token) return false;

  const dotIndex = token.lastIndexOf('.');
  if (dotIndex === -1) return false;

  const encodedPayload = token.slice(0, dotIndex);
  const signature = token.slice(dotIndex + 1);

  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const rawSig = await crypto.subtle.sign('HMAC', key, enc.encode(encodedPayload));
    const expectedSig = uint8ArrayToBase64Url(new Uint8Array(rawSig));

    if (expectedSig !== signature) return false;

    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    return typeof payload?.exp === 'number' && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin/shortener') || pathname.startsWith('/admin/links')) {
    const token = request.cookies.get(ADMIN_COOKIE)?.value;
    const valid = await verifyAdminSession(token ?? '');
    if (!valid) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/shortener/:path*', '/admin/links/:path*'],
};
