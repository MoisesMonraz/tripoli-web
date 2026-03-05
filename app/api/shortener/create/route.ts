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
    const missing = !process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN;
    return NextResponse.json(
      {
        error: missing
          ? 'Vercel KV no está configurado. Crea una base de datos KV en el panel de Vercel y vincula las variables KV_REST_API_URL y KV_REST_API_TOKEN al proyecto.'
          : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
