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
      console.warn("Missing CONTENTFUL_SPACE_ID or CONTENTFUL_ACCESS_TOKEN. Contentful client not initialized.");
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
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const getCategoryMap = unstable_cache(
  async () => {
    const client = getContentfulClient();
    if (!client) return {} as Record<string, string>;
    try {
      const response = await client.getEntries({ content_type: "category", limit: 100 });
      const map: Record<string, string> = {};
      for (const item of response.items) {
        const name = (item.fields as { name?: string }).name || "";
        const slug = slugify(name);
        if (slug) map[slug] = item.sys.id;
      }
      return map;
    } catch (error) {
      console.error("Error fetching category map:", error);
      return {} as Record<string, string>;
    }
  },
  ["contentful-category-map"],
  { revalidate: 3600 }
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformRevista(entry: any): Revista {
  const { fields, sys } = entry;
  const categoryName: string = fields.category?.fields?.name ?? "";
  const subcategoryName: string = fields.subcategory?.fields?.name ?? "";

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

  if (subcategoryName) {
    base.subcategoria = {
      nombre: subcategoryName,
      slug: slugify(subcategoryName),
    };
  }
  if (fields.ogRevista?.fields?.file?.url) {
    base.ogUrl = `https:${fields.ogRevista.fields.file.url as string}`;
  }

  return base;
}

export async function getRevistas(): Promise<Revista[]> {
  const client = getContentfulClient();
  if (!client) return [];
  try {
    const response = await client.getEntries({
      content_type: "revista",
      order: ["-sys.createdAt"],
      limit: 100,
      include: 2,
    });
    return response.items.map(transformRevista);
  } catch (error) {
    console.error("Error fetching revistas:", error);
    return [];
  }
}

export async function getRevista(slug: string): Promise<Revista | null> {
  const client = getContentfulClient();
  if (!client) return null;
  try {
    const response = await client.getEntries({
      content_type: "revista",
      "fields.slugRevista": slug,
      limit: 1,
      include: 2,
    });
    if (!response.items.length) return null;
    return transformRevista(response.items[0]);
  } catch (error) {
    console.error(`Error fetching revista "${slug}":`, error);
    return null;
  }
}

export async function getRevistasByCategory(categoriaSlug: string): Promise<Revista[]> {
  const client = getContentfulClient();
  if (!client) return [];
  try {
    const categoryMap = await getCategoryMap();
    const categoryId = categoryMap[categoriaSlug];
    if (!categoryId) return [];
    const response = await client.getEntries({
      content_type: "revista",
      "fields.category.sys.id": categoryId,
      order: ["-sys.createdAt"],
      limit: 100,
      include: 2,
    });
    return response.items.map(transformRevista);
  } catch (error) {
    console.error(`Error fetching revistas for category "${categoriaSlug}":`, error);
    return [];
  }
}
