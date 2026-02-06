"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import BannerHeader from "../BannerHeader";
import SubcategoryBanner from "../banners/SubcategoryBanner";
import { useLanguage } from "../LanguageProvider";

const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='100%25' height='100%25' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23718096' font-family='Arial, sans-serif' font-size='14'%3ENo Image%3C/text%3E%3C/svg%3E";

const formatFullSpanishDate = (dateInput) => {
  if (!dateInput) return "";
  const dateValue = new Date(dateInput);
  if (Number.isNaN(dateValue.getTime())) return "";
  const formatter = new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const parts = formatter.formatToParts(dateValue).reduce((acc, part) => {
    if (part.type !== "literal") {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});
  if (parts.weekday && parts.day && parts.month && parts.year) {
    return `${parts.weekday} ${parts.day} de ${parts.month} del ${parts.year}`;
  }
  return formatter.format(dateValue);
};

export default function SubcategoryListPageClient({
  title,
  titleEs,
  categorySlug,
  subcategorySlug,
  barColor = "#f39200",
  gradientFrom = "#fce2bf",
  gradientMid,
  initialPosts = [], // Accept pre-fetched data
  BannerComponent = SubcategoryBanner,
}) {
  const { language } = useLanguage();
  const [showAll, setShowAll] = useState(false);

  const INITIAL_LIMIT = 10;

  // Use initialPosts directly instead of useEffect
  const posts = initialPosts;

  const localizedPosts = useMemo(
    () =>
      (posts || []).map((post, idx) =>
        language === "EN"
          ? post
          : {
            ...post,
            title: post.titleEs ?? post.title ?? `Título ${idx + 1}`,
            excerpt: post.excerptEs ?? post.excerpt ?? "Vista previa corta aquí...",
            date: post.dateEs ?? post.date ?? "Noviembre 2025",
          }
      ),
    [posts, language]
  );

  const heading = language === "EN" ? title : titleEs ?? title;
  const isFabricantesEquipoInsumos = subcategorySlug === "fabricantes-equipos-insumos";
  const isFestivalesEventosArtistas = subcategorySlug === "festivales-eventos-y-artistas";
  const isDesarrolladoresProyectos = subcategorySlug === "desarrolladores-de-proyectos";
  const headingClassName = isFabricantesEquipoInsumos
    ? "text-[12.5px] sm:text-lg lg:text-xl"
    : isFestivalesEventosArtistas
      ? "text-[13.5px] sm:text-lg lg:text-xl"
      : isDesarrolladoresProyectos
        ? "text-[13.5px] sm:text-lg lg:text-xl"
        : "text-lg lg:text-xl";
  const buttonLabel = language === "EN" ? "View more news" : "Ver más noticias";
  const barVars = {
    "--bar-base": barColor,
    "--bar-mid": gradientMid || gradientFrom || barColor,
    "--bar-light": gradientFrom || barColor,
  };

  const visiblePosts = showAll ? localizedPosts : localizedPosts.slice(0, INITIAL_LIMIT);
  const showButton = !showAll && localizedPosts.length > INITIAL_LIMIT;

  return (
    <main className="flex flex-col gap-4 pb-20">
      <section className="w-full m-0 p-0">
        <BannerComponent subcategorySlug={subcategorySlug} />
      </section>

      <div className="max-w-[70rem] mx-auto w-full px-4 sm:px-[12px] md:px-4">
        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <span className="h-[44px] w-[8px] subcat-bar subcat-bar--left" style={barVars} aria-hidden="true" />
            <h1 className={`${headingClassName} font-semibold uppercase font-raleway tracking-[0.05em]`} style={{ color: barColor }}>
              {heading}
            </h1>
            <div className="h-[44px] flex-1 rounded-sm subcat-bar subcat-bar--right" aria-hidden="true" style={barVars} />
          </div>

          <div className="flex flex-col gap-4">
            {visiblePosts.map((post) => {
              // Ensuring date is strictly lowercase as requested
              const rawDate = formatFullSpanishDate(post.dateISO) || formatFullSpanishDate(post.date) || post.date || "";
              const formattedDate = rawDate.toLowerCase();

              return (
                <Link key={post.slug} href={post.category && post.subcategory ? `/${post.category}/${post.subcategory}/articulo/${post.slug}` : `/articulo/${post.slug}`} className="block">
                  <article
                    className="flex flex-col items-stretch gap-4 p-4 rounded-xl border border-slate-200/60 bg-white/80 shadow-md shadow-slate-900/5 transition hover:shadow-lg hover:shadow-slate-900/10 hover:border-slate-300
                    md:flex-row md:items-center dark:border-slate-800/70 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:border-slate-500 hover:border-[#00BFFF]/60 dark:hover:border-[#33ceff]/60"
                  >
                    <div className="relative h-[200px] w-full md:h-[180px] md:w-[240px] flex-shrink-0 overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-800">
                      <Image
                        src={post.image || placeholderImage}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-500 hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 240px"
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-center gap-2">
                      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 group-hover:text-[#00BFFF] dark:group-hover:text-[#33ceff]">
                        {post.title}
                      </h2>
                      <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 md:line-clamp-3 leading-relaxed">
                        {post.excerpt}
                      </p>
                      <div className="mt-1 flex flex-col gap-1">
                        <span className="text-[11px] font-sans font-semibold text-slate-800 dark:text-slate-200 tracking-wide">
                          por: Tripoli Publishing House
                        </span>
                        <time className="text-[11px] font-sans text-slate-500 dark:text-slate-400">
                          {formattedDate}
                        </time>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
            {showButton && (
              <div className="flex justify-center mt-6">
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="px-6 py-2 rounded-full border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition
                  dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {buttonLabel}
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      <style>{`
        @property --subcat-grad-pos {
          syntax: "<percentage>";
          inherits: true;
          initial-value: 0%;
        }
        .subcat-bar {
          --subcat-grad-pos: 0%;
          background: linear-gradient(
            90deg,
            var(--bar-base, ${barColor}),
            var(--bar-mid, ${gradientMid || gradientFrom || barColor}),
            var(--bar-light, ${gradientFrom || barColor})
          );
          background-size: 300% 100%;
          background-position: var(--subcat-grad-pos, 0%) 0;
        }
        .subcat-bar--left {
          background: var(--bar-base, ${barColor});
          background-image: none;
          animation: subcatPulse 12s linear infinite;
        }
        .subcat-bar--right {
          animation: subcatGradMove 12s ease-in-out infinite;
        }
        @keyframes subcatGradMove {
          0% { --subcat-grad-pos: 0%; }
          50% { --subcat-grad-pos: 100%; }
          100% { --subcat-grad-pos: 0%; }
        }
        @keyframes subcatPulse {
          0% { background-color: var(--bar-base, ${barColor}); }
          50% { background-color: var(--bar-light, ${gradientFrom || barColor}); }
          100% { background-color: var(--bar-base, ${barColor}); }
        }
      `}</style>
    </main>
  );
}
