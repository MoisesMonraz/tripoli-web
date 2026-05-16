import "server-only";
import { createClient } from "contentful";
import { unstable_cache } from "next/cache";
import type { Revista } from "@/types/revistas";

let cachedClient: ReturnType<typeof createClient> | null = null;
let warnedMissingEnv = false;

const getContentfulClient = () => {
  if (cachedClient) return cachedClient;
  const space = process.env.CONTENTFUL_SPACE_ID;
  const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN;
  if (!space || !accessToken) {
    if (!warnedMissingEnv) {
      console.warn("[revistas] Missing CONTENTFUL_SPACE_ID or CONTENTFUL_ACCESS_TOKEN.");
      warnedMissingEnv = true;
    }
    return null;
  }
  cachedClient = createClient({ space, accessToken, timeout: 8000, retryLimit: 0 });
  return cachedClient;
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .trim();
}

// ── Shared cache key with lib/contentful.js ──────────────────────────────────
const getCategoryMap = unstable_cache(
  async (): Promise<Record<string, string>> => {
    const client = getContentfulClient();
    if (!client) return {};
    try {
      const res = await client.getEntries({ content_type: "category", limit: 100 });
      const map: Record<string, string> = {};
      for (const item of res.items) {
        const slug = slugify((item.fields as { name?: string }).name ?? "");
        if (slug) map[slug] = item.sys.id;
      }
      return map;
    } catch (err) {
      console.error("[revistas] getCategoryMap error:", err);
      return {};
    }
  },
  ["contentful-category-map"],
  { revalidate: 3600 }
);

// Bidirectional subcategory map (different key from lib/contentful.js plain map)
const getSubcategoryBiMap = unstable_cache(
  async (): Promise<{ fwd: Record<string, string>; rev: Record<string, string> }> => {
    const client = getContentfulClient();
    if (!client) return { fwd: {}, rev: {} };
    try {
      const res = await client.getEntries({ content_type: "subcategory", limit: 100 });
      const fwd: Record<string, string> = {}; // slug → sys.id
      const rev: Record<string, string> = {}; // sys.id → slug
      for (const item of res.items) {
        const slug = slugify((item.fields as { name?: string }).name ?? "");
        if (slug) {
          fwd[slug] = item.sys.id;
          rev[item.sys.id] = slug;
        }
      }
      return { fwd, rev };
    } catch (err) {
      console.error("[revistas] getSubcategoryBiMap error:", err);
      return { fwd: {}, rev: {} };
    }
  },
  ["contentful-subcategory-bimap"],
  { revalidate: 3600 }
);

// ── Transform ────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformRevista(entry: any, subcatRev?: Record<string, string>): Revista {
  const { fields, sys } = entry;

  const categoryName: string = (fields.category?.fields?.name as string) ?? "";
  const subcategoryName: string = (fields.subcategory?.fields?.name as string) ?? "";

  // Fallback: if subcategory linked entry wasn't resolved by Contentful, look up slug by sys.id
  let subcatSlug = subcategoryName ? slugify(subcategoryName) : "";
  if (!subcatSlug && fields.subcategory?.sys?.id && subcatRev) {
    subcatSlug = subcatRev[fields.subcategory.sys.id as string] ?? "";
  }

  const base: Revista = {
    id: sys.id as string,
    titulo: (fields.tituloRevista as string) ?? "",
    slug: (fields.slugRevista as string) ?? "",
    descripcion: (fields.descripcionRevista as string) ?? "",
    autor: {
      nombre: (fields.autor?.fields?.name as string) ?? "Tripoli Publishing House",
      slug: (fields.autor?.fields?.slug as string) ?? "",
    },
    categoria: {
      nombre: categoryName,
      slug: slugify(categoryName),
    },
    previewUrl: fields.previewRevista?.fields?.file?.url
      ? `https:${fields.previewRevista.fields.file.url as string}`
      : "",
    pdfUrl: fields.pdfRevista?.fields?.file?.url
      ? `https:${fields.pdfRevista.fields.file.url as string}`
      : "",
    fechaPublicacion: sys.createdAt as string,
  };

  if (subcatSlug) {
    base.subcategoria = {
      nombre: subcategoryName || subcatSlug,
      slug: subcatSlug,
    };
  }
  if (fields.ogRevista?.fields?.file?.url) {
    base.ogUrl = `https:${fields.ogRevista.fields.file.url as string}`;
  }

  return base;
}

// ── Core cached fetcher (invalidated by revalidateTag("revistas")) ────────────

const _fetchAllRevistas = unstable_cache(
  async (): Promise<Revista[]> => {
    const client = getContentfulClient();
    if (!client) return [];
    const [response, { rev: subcatRev }] = await Promise.all([
      client.getEntries({
        content_type: "revista",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        order: ["-sys.createdAt"] as any,
        limit: 100,
        include: 2,
      }),
      getSubcategoryBiMap(),
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (response.items as any[]).map((e) => transformRevista(e, subcatRev));
  },
  ["contentful-revistas-all"],
  { revalidate: false, tags: ["revistas"] }
);

// ── Public API ───────────────────────────────────────────────────────────────

export async function getRevistas(): Promise<Revista[]> {
  try {
    return await _fetchAllRevistas();
  } catch (error) {
    console.error("[revistas] getRevistas error:", error);
    return [];
  }
}

export async function getRevista(slug: string): Promise<Revista | null> {
  const client = getContentfulClient();
  if (!client) return null;
  try {
    const [{ rev: subcatRev }, response] = await Promise.all([
      getSubcategoryBiMap(),
      client.getEntries({
        content_type: "revista",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...({ "fields.slugRevista": slug } as any),
        limit: 1,
        include: 2,
      }),
    ]);
    if (response.items.length > 0) {
      return transformRevista(response.items[0], subcatRev);
    }
    // Fallback: scan cached list
    const all = await _fetchAllRevistas();
    return all.find((r) => r.slug === slug) ?? null;
  } catch (error) {
    console.error(`[revistas] getRevista("${slug}") error:`, error);
    try {
      const all = await _fetchAllRevistas();
      return all.find((r) => r.slug === slug) ?? null;
    } catch {
      return null;
    }
  }
}

export async function getRevistasByCategory(categoriaSlug: string): Promise<Revista[]> {
  try {
    const [all, catMap] = await Promise.all([_fetchAllRevistas(), getCategoryMap()]);
    const catId = catMap[categoriaSlug];
    if (!catId) return [];
    // Primary: slug comparison (fast, uses cached data)
    let filtered = all.filter((r) => r.categoria.slug === categoriaSlug);
    // Fallback: if slug didn't match (linked entry wasn't resolved), re-fetch and filter by sys.id
    if (filtered.length === 0 && all.length > 0) {
      filtered = await _filterRawByCategoryId(catId);
    }
    return filtered;
  } catch (error) {
    console.error(`[revistas] getRevistasByCategory("${categoriaSlug}") error:`, error);
    return [];
  }
}

async function _filterRawByCategoryId(catId: string): Promise<Revista[]> {
  const client = getContentfulClient();
  if (!client) return [];
  const [response, { rev: subcatRev }] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    client.getEntries({ content_type: "revista", order: ["-sys.createdAt"] as any, limit: 100, include: 2 }),
    getSubcategoryBiMap(),
  ]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (response.items as any[])
    .filter((item) => (item.fields?.category?.sys?.id as string) === catId)
    .map((e) => transformRevista(e, subcatRev));
}

export async function getRevistasBySubcategory(subcatSlug: string): Promise<Revista[]> {
  try {
    const [all, { fwd: subcatFwd }] = await Promise.all([_fetchAllRevistas(), getSubcategoryBiMap()]);
    const subcatId = subcatFwd[subcatSlug];
    if (!subcatId) return [];
    return all.filter((r) => r.subcategoria?.slug === subcatSlug);
  } catch (error) {
    console.error(`[revistas] getRevistasBySubcategory("${subcatSlug}") error:`, error);
    return [];
  }
}

// ── Helper: Revista → article-compatible post shape ──────────────────────────

export { revistaToPost } from "./revista-utils";
