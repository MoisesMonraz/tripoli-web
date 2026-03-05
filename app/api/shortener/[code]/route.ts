import { NextRequest, NextResponse } from 'next/server';
import { getShortURL, deleteShortURL } from '@/lib/shortener';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const data = await getShortURL(code);

    if (!data) {
      return NextResponse.json(
        { error: 'URL not found' },
        { status: 404 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tripoli.media';

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        shortUrl: `${baseUrl}/l/${data.code}`,
      },
    });

  } catch (error) {
    console.error('Error fetching URL:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const deleted = await deleteShortURL(code);

    if (!deleted) {
      return NextResponse.json(
        { error: 'URL not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'URL deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting URL:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
