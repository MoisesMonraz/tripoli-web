import { NextResponse } from 'next/server';
import { getAllShortURLs } from '@/lib/shortener';

export async function GET() {
  try {
    const urls = await getAllShortURLs();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tripoli.media';

    const urlsWithShortLinks = urls.map(url => ({
      ...url,
      shortUrl: `${baseUrl}/l/${url.code}`,
    }));

    return NextResponse.json({
      success: true,
      data: urlsWithShortLinks,
    });

  } catch (error) {
    console.error('Error fetching URLs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
