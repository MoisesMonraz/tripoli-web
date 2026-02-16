"use client";

import NewsCardHorizontal from "./NewsCardHorizontal";

const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='100%25' height='100%25' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23718096' font-family='Arial, sans-serif' font-size='14'%3ENo Image%3C/text%3E%3C/svg%3E";

export default function NewsCarousel({ posts = [], compact = false }) {
  // Create placeholder posts if array is empty to maintain carousel structure
  const placeholderPosts = [
    {
      slug: "placeholder-1",
      title: "Sin artículos disponibles",
      excerpt: "Nuevo contenido próximamente...",
      image: placeholderImage,
      date: "Próximamente",
    },
    {
      slug: "placeholder-2",
      title: "Sin artículos disponibles",
      excerpt: "Nuevo contenido próximamente...",
      image: placeholderImage,
      date: "Próximamente",
    },
    {
      slug: "placeholder-3",
      title: "Sin artículos disponibles",
      excerpt: "Nuevo contenido próximamente...",
      image: placeholderImage,
      date: "Próximamente",
    },
  ];

  const items = posts.length > 0 ? posts.slice(0, 6) : placeholderPosts;

  return (
    <div className="relative">
      <div
        className={`flex gap-3 md:gap-4 overflow-x-auto ${compact ? "pb-0" : "pb-2"} pr-2 snap-x snap-mandatory scrollbar-hide`}
      >
        {items.map((item, idx) => (
          <div key={item.slug ?? idx} className="flex-shrink-0 snap-start">
            <NewsCardHorizontal {...item} />
          </div>
        ))}
      </div>
    </div>
  );
}
