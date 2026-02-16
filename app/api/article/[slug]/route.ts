import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'contentful';

// Locale mapping - Spanish in en-US (due to legacy Contentful setup)
const LOCALE_MAP: Record<string, string> = {
  ES: 'en-US',
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='200'%3E%3Crect width='100%25' height='100%25' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23718096' font-family='Arial, sans-serif' font-size='16'%3ENo Image%3C/text%3E%3C/svg%3E";

interface ContentfulAsset {
  fields?: {
    file?: { url?: string };
    title?: string;
    description?: string;
  };
}

interface ContentfulEntry {
  sys: { id: string; createdAt: string };
  fields: {
    title?: string;
    category?: { fields?: { name?: string } };
    subcategory?: { fields?: { name?: string } };
    previewImage?: ContentfulAsset;
    image1?: ContentfulAsset;
    image?: ContentfulAsset;
    image2?: ContentfulAsset;
    image3?: ContentfulAsset;
    introduccion?: unknown;
    body1?: unknown;
    body2?: unknown;
    cierre?: unknown;
    fuentes?: unknown;
    body?: unknown;
  };
}

function transformArticle(entry: ContentfulEntry) {
  const { fields, sys } = entry;

  const categoryName = fields.category?.fields?.name || '';
  const subcategoryName = fields.subcategory?.fields?.name || '';

  const extractImage = (imageField?: ContentfulAsset) => {
    if (!imageField?.fields?.file?.url) return { url: null, caption: '' };
    return {
      url: `https:${imageField.fields.file.url}`,
      caption: imageField.fields.description || imageField.fields.title || '',
    };
  };

  const previewImage = extractImage(fields.previewImage);
  const image1 = extractImage(fields.image1 || fields.image);
  const image2 = extractImage(fields.image2);
  const image3 = extractImage(fields.image3);
  const listingImage = previewImage.url ? previewImage : image1;

  return {
    id: sys.id,
    title: fields.title || 'Untitled',
    slug: slugify(fields.title || sys.id),
    excerpt: '',
    date: new Date(sys.createdAt).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    dateISO: sys.createdAt,
    image: listingImage.url || placeholderImage,
    imageCaption: listingImage.caption,
    introduccion: fields.introduccion || null,
    image1: image1.url,
    image1Caption: image1.caption,
    body1: fields.body1 || null,
    image2: image2.url,
    image2Caption: image2.caption,
    body2: fields.body2 || null,
    image3: image3.url,
    image3Caption: image3.caption,
    cierre: fields.cierre || null,
    fuentes: fields.fuentes || null,
    content: fields.body || null,
    category: slugify(categoryName),
    categoryName,
    subcategory: slugify(subcategoryName),
    subcategoryName,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const language = searchParams.get('lang') || 'ES';
  const locale = LOCALE_MAP[language] || LOCALE_MAP.ES;

  const space = process.env.CONTENTFUL_SPACE_ID;
  const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN;

  if (!space || !accessToken) {
    return NextResponse.json(
      { error: 'Contentful not configured' },
      { status: 500 }
    );
  }

  try {
    const client = createClient({ space, accessToken });
    const query = slug.replace(/-/g, ' ');

    const response = await client.getEntries({
      content_type: 'blogPost',
      query,
      limit: 25,
      include: 2,
      locale,
    });

    const entry = response.items.find(
      (item) => slugify((item.fields.title as string) || '') === slug
    );

    if (!entry) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    const article = transformArticle(entry as unknown as ContentfulEntry);
    return NextResponse.json(article);
  } catch (error) {
    console.error(`Error fetching article ${slug}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}
