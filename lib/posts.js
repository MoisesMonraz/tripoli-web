const placeholderImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='200'%3E%3Crect width='100%25' height='100%25' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23718096' font-family='Arial, sans-serif' font-size='16'%3EImagen%3C/text%3E%3C/svg%3E";

function buildPlaceholderPosts(categorySlug, subcategorySlug) {
  return Array.from({ length: 5 }).map((_, idx) => ({
    title: `Placeholder Title ${idx + 1}`,
    titleEs: `Título ${idx + 1}`,
    excerpt: "Short preview text here...",
    excerptEs: "Vista previa corta aquí...",
    date: "November 2025",
    dateEs: "Noviembre 2025",
    image: placeholderImage,
    slug: `${categorySlug}-${subcategorySlug}-${idx + 1}`,
  }));
}

export function getPostsBySubcategory(categorySlug, subcategorySlug) {
  // Placeholder/mock until CMS integration (Contentful).
  return buildPlaceholderPosts(categorySlug, subcategorySlug);
}
