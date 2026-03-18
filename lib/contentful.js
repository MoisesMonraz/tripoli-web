import "server-only";
import { createClient } from 'contentful';
import { unstable_cache } from 'next/cache';

let cachedClient = null;
let warnedMissingEnv = false;

/**
 * Locale mapping for Contentful
 * Due to legacy setup, Spanish content is stored in 'en-US' locale
 */
export const LOCALE_MAP = {
  ES: 'en-US',
};

const getContentfulClient = () => {
  if (cachedClient) return cachedClient;
  const space = process.env.CONTENTFUL_SPACE_ID;
  const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN;
  if (!space || !accessToken) {
    if (!warnedMissingEnv) {
      console.warn(
        "Missing CONTENTFUL_SPACE_ID or CONTENTFUL_ACCESS_TOKEN. Contentful client not initialized."
      );
      warnedMissingEnv = true;
    }
    return null;
  }
  cachedClient = createClient({ space, accessToken, timeout: 8000, retryLimit: 0 });
  return cachedClient;
};

// Placeholder image for articles without featured images
const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='200'%3E%3Crect width='100%25' height='100%25' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23718096' font-family='Arial, sans-serif' font-size='16'%3ENo Image%3C/text%3E%3C/svg%3E";

/**
 * Convert text to URL-friendly slug
 */
function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Category and subcategory maps cached in Next.js data cache (persists across cold starts)
// This prevents duplicate Contentful calls when multiple parallel page renders hit the same cache miss

const ARTICLE_CACHE_TTL_MS = 5 * 60 * 1000;
const articleCache = new Map();

const getCachedArticle = (slug) => {
  const entry = articleCache.get(slug);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    articleCache.delete(slug);
    return undefined;
  }
  return entry.value;
};

const setCachedArticle = (slug, value) => {
  articleCache.set(slug, { value, expiresAt: Date.now() + ARTICLE_CACHE_TTL_MS });
};

/**
 * Fetch and cache category slug → entry ID map.
 * Cached in Next.js data cache for 1 hour — survives cold starts and
 * deduplicates the 6 parallel homepage calls that previously all hit Contentful.
 */
const getCategoryMap = unstable_cache(
  async () => {
    const client = getContentfulClient();
    if (!client) return {};
    try {
      const response = await client.getEntries({
        content_type: 'category',
        limit: 100,
      });
      const map = {};
      for (const item of response.items) {
        const slug = slugify(item.fields.name);
        map[slug] = item.sys.id;
      }
      return map;
    } catch (error) {
      console.error('Error fetching category map:', error);
      return {};
    }
  },
  ['contentful-category-map'],
  { revalidate: 3600 }
);

/**
 * Fetch and cache subcategory slug → entry ID map.
 * Cached in Next.js data cache for 1 hour.
 */
const getSubcategoryMap = unstable_cache(
  async () => {
    const client = getContentfulClient();
    if (!client) return {};
    try {
      const response = await client.getEntries({
        content_type: 'subcategory',
        limit: 100,
      });
      const map = {};
      for (const item of response.items) {
        const slug = slugify(item.fields.name);
        map[slug] = item.sys.id;
      }
      return map;
    } catch (error) {
      console.error('Error fetching subcategory map:', error);
      return {};
    }
  },
  ['contentful-subcategory-map'],
  { revalidate: 3600 }
);

/**
 * Transform Contentful entry to app format
 *
 * NEW modular blogPost fields:
 * - title (Symbol)
 * - introduccion (Rich Text)
 * - image1 (Media) - hero image, also used for listing thumbnails
 * - body1 (Rich Text)
 * - image2 (Media)
 * - body2 (Rich Text)
 * - image3 (Media)
 * - cierre (Rich Text)
 * - fuentes (Rich Text)
 * - category (Entry link → category)
 * - subcategory (Entry link → subcategory)
 *
 * References are resolved via include param so fields.category.fields.name is available.
 */
function extractText(node) {
  if (!node) return '';
  if (Array.isArray(node)) {
    return node.map(extractText).join(' ');
  }
  // Handle Rich Text node structure
  if (node.nodeType === 'text') return node.value || '';
  if (node.content && Array.isArray(node.content)) {
    return node.content.map(extractText).join(' ');
  }
  // Handle plain string fallback
  if (typeof node === 'string') return node;
  return '';
}

function transformArticle(entry) {
  const { fields, sys } = entry;

  // category and subcategory are resolved reference entries
  const categoryName = fields.category?.fields?.name || '';
  const subcategoryName = fields.subcategory?.fields?.name || '';

  // Helper to extract image URL and caption
  const extractImage = (imageField, captionField = null) => {
    if (!imageField?.fields?.file?.url) return { url: null, caption: '' };
    return {
      url: `https:${imageField.fields.file.url}`,
      caption: captionField || imageField.fields.description || imageField.fields.title || '',
    };
  };

  // Extract all images
  const previewImage = extractImage(fields.previewImage); // New optional preview image
  const image1 = extractImage(fields.image1 || fields.image, fields.image1Caption); // Fallback to old 'image' field
  const image2 = extractImage(fields.image2, fields.image2Caption);
  const image3 = extractImage(fields.image3, fields.image3Caption);

  // For listing cards: use previewImage if available, otherwise fall back to image1
  const listingImage = previewImage.url ? previewImage : image1;

  // Use Contentful excerpt field, fallback to derived from introduccion
  const rawIntro = extractText(fields.introduccion).trim();
  const deriveExcerpt = (text, max = 160) => {
    if (!text) return fields.title || 'Untitled';
    if (text.length <= max) return text;
    const trimmed = text.slice(0, max);
    const lastSpace = trimmed.lastIndexOf(' ');
    return (lastSpace > 0 ? trimmed.slice(0, lastSpace) : trimmed) + '…';
  };
  const articleExcerpt = fields.excerpt || deriveExcerpt(rawIntro);

  return {
    id: sys.id,
    title: fields.title || 'Untitled',
    subtitle: fields.subtitle || fields.subtitulo || null,
    slug: fields.slug || slugify(fields.title || sys.id),
    excerpt: articleExcerpt,
    date: new Date(sys.createdAt).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    dateISO: sys.createdAt,
    dateEs: new Date(sys.createdAt).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
    }),
    // Image for listing cards (uses previewImage if set, otherwise image1)
    image: listingImage.url || placeholderImage,
    imageCaption: listingImage.caption,
    // Modular content fields (new structure)
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
    // Legacy field for backward compatibility
    content: fields.body || null,
    category: slugify(categoryName),
    categoryName,
    subcategory: slugify(subcategoryName),
    subcategoryName,
    author: (() => {
      // Primary: use the linked Author Reference from Contentful
      const authorEntry = fields.author;
      if (authorEntry?.fields) {
        const photoUrl = authorEntry.fields.photo?.fields?.file?.url
          ? `https:${authorEntry.fields.photo.fields.file.url}`
          : null;
        return {
          name: authorEntry.fields.name || 'Tripoli Publishing House',
          slug: authorEntry.fields.slug || null,
          role: authorEntry.fields.role || null,
          bio: authorEntry.fields.bio || null,
          photo: photoUrl ? { url: photoUrl } : null,
        };
      }
      // Fallback: legacy slug-to-name mapping for articles not yet linked in Contentful
      const articleSlug = slugify(fields.title || sys.id);
      const authorMap = {
        'el-iva-en-tus-seguros-la-decision-fiscal-que-encarece-tu-proteccion': 'Juan Ignacio Armenta',
        'reforma-electoral-2026-el-debate-de-los-plurinominales': 'Emiliano Méndez Alonso',
        'la-reforma-de-las-40-horas-justicia-social-y-el-reto-de-la-supervivencia-pyme': 'Emiliano Méndez Alonso',
      };
      const authorSlugMap = {
        'Juan Ignacio Armenta': 'juan-ignacio-armenta',
        'Emiliano Méndez Alonso': 'emiliano-mendez-alonso',
      };
      const authorName = authorMap[articleSlug] || 'Tripoli Publishing House';
      return {
        name: authorName,
        slug: authorSlugMap[authorName] || null,
        role: null,
        bio: null,
        photo: null,
      };
    })(),
    ogImage: (() => {
      const img = fields.ogImage;
      if (!img?.fields?.file?.url) return null;
      return {
        url: `https:${img.fields.file.url}`,
        width: img.fields.file.details?.image?.width || null,
        height: img.fields.file.details?.image?.height || null,
      };
    })(),
    featured: false,
    metaTitle: fields.title || 'Untitled',
    metaDescription: articleExcerpt,
    plainTextContent: [
      extractText(fields.introduccion),
      extractText(fields.body1),
      extractText(fields.body2),
      extractText(fields.cierre),
      extractText(fields.body) // Legacy fallback
    ].filter(Boolean).join(' ').slice(0, 5000), // Limit total content size for context
  };
}

/**
 * Get articles by category (for home page carousels)
 * Filters blogPosts by linked category entry ID
 * @param {string} categorySlug - Category slug (e.g. "consumo-y-retail")
 * @param {number} limit - Maximum number of articles to fetch
 * @returns {Promise<Array>} Array of transformed articles
 */
export async function getArticlesByCategory(categorySlug, limit = 6) {
  const client = getContentfulClient();
  if (!client) return [];
  try {
    const categoryMap = await getCategoryMap();
    const categoryId = categoryMap[categorySlug];

    if (!categoryId) return [];

    const response = await client.getEntries({
      content_type: 'blogPost',
      'fields.category.sys.id': categoryId,
      order: ['-sys.createdAt'],
      limit,
      include: 2,
    });
    return response.items.map(transformArticle);
  } catch (error) {
    console.error(`Error fetching articles for ${categorySlug}:`, error);
    return [];
  }
}

/**
 * Get articles by subcategory (for category & subcategory pages)
 * Filters blogPosts by linked subcategory entry ID
 * @param {string} categorySlug - Category slug (kept for API consistency)
 * @param {string} subcategorySlug - Subcategory slug (e.g. "cadenas-comerciales")
 * @param {number} limit - Maximum number of articles to fetch
 * @returns {Promise<Array>} Array of transformed articles
 */
export async function getArticlesBySubcategory(categorySlug, subcategorySlug, limit = 20) {
  const client = getContentfulClient();
  if (!client) return [];
  try {
    const subcategoryMap = await getSubcategoryMap();
    const subcategoryId = subcategoryMap[subcategorySlug];

    if (!subcategoryId) return [];

    const response = await client.getEntries({
      content_type: 'blogPost',
      'fields.subcategory.sys.id': subcategoryId,
      order: ['-sys.createdAt'],
      limit,
      include: 2,
    });
    return response.items.map(transformArticle);
  } catch (error) {
    console.error(`Error fetching articles for ${categorySlug}/${subcategorySlug}:`, error);
    return [];
  }
}

/**
 * Get single article by title-derived slug (for article detail pages)
 * Since blogPost has no slug field, fetches all entries and matches by slugified title
 * @param {string} slug - URL slug derived from article title
 * @param {string} language - Language code ('ES' or 'EN'), defaults to 'ES'
 * @returns {Promise<Object|null>} Transformed article or null if not found
 */
export async function getArticleBySlug(slug, language = 'ES') {
  const client = getContentfulClient();
  if (!client) return null;

  const locale = LOCALE_MAP[language] || LOCALE_MAP.ES;
  const cacheKey = `${slug}_${locale}`;

  try {
    const cached = getCachedArticle(cacheKey);
    if (cached !== undefined) return cached;

    const query = slug.replace(/-/g, ' ');
    const response = await client.getEntries({
      content_type: 'blogPost',
      query,
      limit: 25,
      include: 2,
      locale,
    });

    // First try a strict match with the slug field
    let entry = response.items.find((item) => item.fields.slug === slug);
    // Fall back to matching by slugified title
    if (!entry) {
      entry = response.items.find(
        (item) => slugify(item.fields.title || '') === slug
      );
    }

    if (!entry) {
      setCachedArticle(cacheKey, null);
      return null;
    }
    const article = transformArticle(entry);
    setCachedArticle(cacheKey, article);
    return article;
  } catch (error) {
    console.error(`Error fetching article ${slug}:`, error);
    return null;
  }
}

/**
 * Get latest articles across all categories
 * @param {number} limit - Maximum number of articles to fetch
 * @returns {Promise<Array>} Array of transformed articles
 */
export async function getLatestArticles(limit = 30) {
  const client = getContentfulClient();
  if (!client) return [];
  try {
    const response = await client.getEntries({
      content_type: 'blogPost',
      order: ['-sys.createdAt'],
      limit,
      include: 2,
    });
    return response.items.map(transformArticle);
  } catch (error) {
    console.error('Error fetching latest articles:', error);
    return [];
  }
}

/**
 * Bilingual stop words stripped before Contentful full-text search.
 * Contentful uses AND logic for multi-word queries, so noise words
 * like "que", "sobre", "the" cause zero results.
 */
const STOP_WORDS = new Set([
  // Spanish
  'que', 'cual', 'cuales', 'como', 'donde', 'cuando', 'cuanto', 'por', 'para',
  'de', 'del', 'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'al',
  'en', 'con', 'sin', 'sobre', 'entre', 'es', 'son', 'esta', 'estan', 'hay',
  'tiene', 'tienen', 'ser', 'fue', 'sido', 'y', 'o', 'pero', 'si', 'no',
  'me', 'te', 'se', 'nos', 'les', 'su', 'sus', 'mi', 'tu', 'yo',
  'mas', 'muy', 'ya', 'a', 'e',
  // English
  'the', 'a', 'an', 'of', 'to', 'for', 'with', 'from', 'by', 'in', 'on',
  'at', 'is', 'are', 'was', 'were', 'be', 'been', 'has', 'have', 'had',
  'do', 'does', 'did', 'will', 'would', 'can', 'could', 'should',
  'and', 'or', 'but', 'not', 'if', 'it', 'its', 'this', 'that', 'what',
  'which', 'who', 'how', 'when', 'where', 'why',
  // Common query words
  'articulos', 'articulo', 'articles', 'article', 'tienen', 'tienes',
  'noticias', 'noticia', 'news', 'hay', 'dame', 'dime', 'muestrame',
  'show', 'tell', 'find', 'search', 'give', 'get',
]);

/**
 * Extract meaningful keywords from a query by removing stop words.
 * Returns the cleaned query, or the original if stripping leaves nothing.
 */
function extractKeywords(query) {
  const words = query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/g)
    .filter(w => w.length > 0 && !STOP_WORDS.has(w)); // Changed from > 1 to > 0 to allow "K", "X", etc.
  return words.length > 0 ? words.join(' ') : query;
}

/**
 * Full-text search across blogPost entries using Contentful's native query
 * Searches title, body (RichText text nodes), and other text fields.
 * Stop words are automatically stripped to avoid Contentful's AND-matching
 * returning zero results for conversational queries.
 * @param {string} query - Search keywords
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Array>} Array of transformed articles matching the query
 */
export async function searchArticles(query, limit = 10) {
  const client = getContentfulClient();
  if (!client) return [];
  try {
    const cleanQuery = extractKeywords(query);
    const response = await client.getEntries({
      content_type: 'blogPost',
      query: cleanQuery,
      order: ['-sys.createdAt'],
      limit,
      include: 2,
    });
    return response.items.map(transformArticle);
  } catch (error) {
    console.error('Error searching articles:', error);
    return [];
  }
}

/**
 * Fetch entries from the 'blogPost' content model (legacy function for backward compatibility)
 * @returns {Promise} A promise that resolves to the blog posts
 */
export async function getArticles() {
  return getLatestArticles(100);
}

/**
 * Get all articles written by a specific author name.
 * Since the author field is computed in transformArticle (not stored natively in Contentful),
 * we fetch all articles and filter by the computed author value.
 * @param {string} authorName - The display name of the author (e.g. "Emiliano Méndez Alonso")
 * @param {number} limit - Maximum number of articles to fetch before filtering
 * @returns {Promise<Array>} Array of transformed articles matching the author
 */
export async function getArticlesByAuthor(authorName, limit = 200) {
  const client = getContentfulClient();
  if (!client) return [];
  try {
    const response = await client.getEntries({
      content_type: 'blogPost',
      order: ['-sys.createdAt'],
      limit,
      include: 2,
    });
    const all = response.items.map(transformArticle);
    return all.filter((article) => article.author?.name === authorName);
  } catch (error) {
    console.error(`Error fetching articles by author "${authorName}":`, error);
    return [];
  }
}


/**
 * Fetch a single Author entry from Contentful by slug.
 * @param {string} authorSlug - The author's URL slug (e.g. "emiliano-mendez-alonso")
 * @returns {Promise<Object|null>} Author data or null if not found
 */
export async function getAuthorBySlugFromContentful(authorSlug) {
  const client = getContentfulClient();
  if (!client) return null;
  try {
    const response = await client.getEntries({
      content_type: 'author',
      'fields.slug': authorSlug,
      limit: 1,
      include: 1,
    });
    if (!response.items.length) return null;
    const entry = response.items[0];
    const photoUrl = entry.fields.photo?.fields?.file?.url
      ? `https:${entry.fields.photo.fields.file.url}`
      : null;
    return {
      id: entry.sys.id,
      name: entry.fields.name || '',
      slug: entry.fields.slug || authorSlug,
      role: entry.fields.role || null,
      bio: entry.fields.bio || null,
      photoUrl,
    };
  } catch (error) {
    console.error(`Error fetching author "${authorSlug}":`, error);
    return null;
  }
}

/**
 * Fetch all articles linked to a specific Author entry by their slug.
 * Uses Contentful's reference field filtering for precise results.
 * @param {string} authorSlug - The author's URL slug
 * @param {number} limit - Max articles to return
 * @returns {Promise<Array>} Array of transformed articles
 */
export async function getArticlesByAuthorSlug(authorSlug, limit = 200) {
  const client = getContentfulClient();
  if (!client) return [];
  try {
    const authorResponse = await client.getEntries({
      content_type: 'author',
      'fields.slug': authorSlug,
      limit: 1,
    });
    if (!authorResponse.items.length) return [];
    const authorId = authorResponse.items[0].sys.id;

    const response = await client.getEntries({
      content_type: 'blogPost',
      'fields.author.sys.id': authorId,
      order: ['-sys.createdAt'],
      limit,
      include: 2,
    });
    return response.items.map(transformArticle);
  } catch (error) {
    console.error(`Error fetching articles for author "${authorSlug}":`, error);
    return [];
  }
}

/**
 * Get all author slugs from Contentful (used for generateStaticParams).
 * @returns {Promise<string[]>} Array of author slugs
 */
export async function getAllAuthorSlugs() {
  const client = getContentfulClient();
  if (!client) return [];
  try {
    const response = await client.getEntries({
      content_type: 'author',
      select: ['fields.slug'],
      limit: 100,
    });
    return response.items.map(item => item.fields.slug).filter(Boolean);
  } catch (error) {
    console.error('Error fetching author slugs:', error);
    return [];
  }
}
