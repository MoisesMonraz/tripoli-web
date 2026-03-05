import { NextRequest, NextResponse } from 'next/server';
import { getShortURL, incrementClicks } from '@/lib/shortener';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  try {
    const data = await getShortURL(code);

    if (!data) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Fire-and-forget: don't block the redirect
    incrementClicks(code);

    return NextResponse.redirect(data.originalUrl, { status: 307 });

  } catch (error) {
    console.error('Error redirecting:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}
