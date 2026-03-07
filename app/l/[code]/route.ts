import { NextRequest, NextResponse } from 'next/server';
import { getShortURL, incrementClicks } from '@/lib/shortener';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  try {
    const timeout = new Promise<null>((_, reject) =>
      setTimeout(() => reject(new Error('Redis timeout')), 5000)
    );
    const data = await Promise.race([getShortURL(code), timeout]);

    if (!data) {
      return new Response(
        `<html><body><p>Enlace no encontrado.</p><a href="https://tripoli.media">Ir a Tripoli Media</a></body></html>`,
        { status: 404, headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Fire-and-forget: don't block the redirect
    incrementClicks(code);

    return NextResponse.redirect(data.originalUrl, { status: 302 });

  } catch (error) {
    console.error('Error redirecting:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}
