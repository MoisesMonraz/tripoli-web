import { NextRequest, NextResponse } from 'next/server';
import { createShortURL } from '@/lib/shortener';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    const shortURL = await createShortURL(url);

    if (!shortURL) {
      return NextResponse.json(
        { error: 'Invalid URL. Only tripoli.media URLs are allowed.' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tripoli.media';

    return NextResponse.json({
      success: true,
      data: {
        ...shortURL,
        shortUrl: `${baseUrl}/l/${shortURL.code}`,
      },
    });

  } catch (error) {
    console.error('Error creating short URL:', error);
    const missing = !process.env.KV_REDIS_URL;
    return NextResponse.json(
      {
        error: missing
          ? 'Redis no está configurado. Agrega la variable de entorno KV_REDIS_URL en el panel de Vercel.'
          : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
