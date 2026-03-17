import { NextRequest, NextResponse } from 'next/server';
import { getShortURL, incrementClicks } from '@/lib/shortener';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  try {
    const data = await getShortURL(code);

    if (!data) {
      return new Response(
        `<html><body><p>Enlace no encontrado.</p><a href="https://tripoli.media">Ir a Tripoli Media</a></body></html>`,
        {
          status: 404,
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 's-maxage=60',
          },
        }
      );
    }

    // Fire-and-forget: don't block the redirect
    incrementClicks(code);

    const redirectUrl = data.originalUrl;
    return new Response(null, {
      status: 302,
      headers: {
        'Location': redirectUrl,
        'Cache-Control': 's-maxage=3600, stale-while-revalidate=600',
      },
    });

  } catch (error) {
    console.error('Error redirecting:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}
