"use client";

import NewsCarousel from "./home/NewsCarousel";

export default function CategorySubsection({
  title,
  posts = [],
  barColor = "#fdc652",
  titleBgColor = "#f39200",
  titleHoverBgColor = "#d87d00",
  titleActiveBgColor = "#b86200",
  titleTextColor = "#fee5c8",
  BannerComponent,
  labelEs,
}) {
  const label = labelEs ?? "Novedades";
  const heading = title;

  const localizedPosts = (posts || []).slice(0, 5).map((post, idx) => ({
    ...post,
    title: post.titleEs ?? `Titulo ${idx + 1}`,
    excerpt: post.excerptEs ?? "Vista previa corta aqui...",
    date: post.dateEs ?? "Noviembre 2025",
  }));

  return (
    <section className="flex flex-col gap-2 px-4 max-w-[70rem] mx-auto w-full sm:px-[12px] md:px-4">
      <div className="flex items-center justify-between">
        <div className="flex items-stretch gap-0">
          <span className="h-[44px] w-[8px]" style={{ backgroundColor: barColor }} aria-hidden="true" />

          <h1
            className="
              flex h-[44px] items-center px-3 
              rounded-r-lg rounded-l-none 
              text-lg lg:text-xl font-semibold uppercase 
              tracking-[0.05em] transition-colors
              text-[var(--text)]
              bg-[var(--bg)]
            "
            style={{
              "--bg": titleBgColor,
              "--bg-hover": titleHoverBgColor,
              "--bg-active": titleActiveBgColor,
              "--text": titleTextColor,
            }}
          >
            {heading}
          </h1>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-[14px] font-bold uppercase tracking-[0.08em] text-slate-700 dark:text-slate-200">{label}</p>
        <NewsCarousel posts={localizedPosts} compact />
      </div>

      {BannerComponent ? <BannerComponent /> : null}
    </section>
  );
}

