import type { Revista } from "@/types/revistas";

export function revistaToPost(r: Revista) {
  const categorySlug = r.categoria?.slug ?? "";
  const subcategorySlug = r.subcategoria?.slug ?? "";
  const href = subcategorySlug
    ? `/${categorySlug}/${subcategorySlug}/revista/${r.slug}`
    : `/revistas/${r.slug}`;
  return {
    id: r.id,
    title: r.titulo,
    excerpt: r.descripcion,
    image: r.previewUrl,
    date: new Date(r.fechaPublicacion).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    dateISO: r.fechaPublicacion,
    slug: r.slug,
    author: { name: r.autor.nombre, slug: r.autor.slug },
    category: categorySlug,
    subcategory: subcategorySlug || categorySlug,
    href,
    badge: "REVISTA" as const,
    isRevista: true,
  };
}
