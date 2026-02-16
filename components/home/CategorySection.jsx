"use client";

import Link from "next/link";
import NewsCarousel from "./NewsCarousel";
import BannerConsumoRetail from "./BannerConsumoRetail";

export default function CategorySection({
  title,
  slug,
  titleHref,
  posts,
  BannerComponent = BannerConsumoRetail,
}) {
  const linkHref = titleHref || `/categoria/${slug}`;
  const themeKey = slug || "default";

  const heading = title;
  const newsLabel = "\u00daltimas noticias";
  const moreNewsLabel = "Ver m\u00e1s noticias";

  const localizedPosts = (posts || []).map((post, idx) => ({
    ...post,
    title: post.titleEs ?? post.title ?? `T\u00edtulo ${idx + 1}`,
    excerpt: post.excerptEs ?? post.excerpt ?? "Vista previa corta aqu\u00ed...",
    date: post.dateEs ?? post.date ?? "Noviembre 2025",
  }));

  return (
    <section className="flex flex-col gap-4 px-4 max-w-[70rem] mx-auto w-full sm:px-[12px] md:px-4">
      <div className="flex items-center justify-between">
        <div className="flex items-stretch gap-0 w-full cat-bar" data-cat-theme={themeKey}>
          <span className="h-[44px] w-[8px] cat-bar-left" aria-hidden="true" />

          <Link href={linkHref} className="group">
            <h1
              className="
                flex h-[44px] items-center px-3
                text-lg lg:text-xl font-semibold uppercase font-raleway
                tracking-[0.05em] transition-colors
                text-[var(--text)]
                group-hover:text-[var(--text-hover)]
                group-active:text-[var(--text-active)]
                group-focus:text-[var(--text-active)]
                group-focus-visible:text-[var(--text-active)]
              "
            >
              {heading}
            </h1>
          </Link>
          <div className="h-[44px] flex-1 cat-bar-right" aria-hidden="true" />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-[10.5px] sm:text-[14px] font-bold uppercase tracking-[0.08em] text-slate-700 dark:text-slate-200">{newsLabel}</p>
        <NewsCarousel posts={localizedPosts} />
        <Link
          href={linkHref}
          className="
            group relative text-right text-[10.5px] sm:text-[14px] font-bold uppercase tracking-[0.08em]
            text-slate-700 dark:text-slate-200
            transition-colors duration-200
            hover:text-[#00BFFF] dark:hover:text-[#33ceff]
            inline-block self-end
          "
        >
          <span className="relative inline-block">
            {moreNewsLabel}
            <span
              className="
                absolute left-0 right-0 bottom-0 h-px
                origin-left scale-x-0 transition-transform duration-200 ease-out
                bg-gradient-to-r from-[#00BFFF] to-[#33ceff]
                group-hover:scale-x-100
                dark:from-[#33ceff] dark:to-[#66deff]
                will-change: transform
              "
              aria-hidden="true"
            />
          </span>
        </Link>
      </div>

      <div className="-mx-4 sm:-mx-[12px] md:-mx-4 mb-4">
        <BannerComponent />
      </div>
    </section>
  );
}
