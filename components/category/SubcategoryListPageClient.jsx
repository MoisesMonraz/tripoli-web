"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import BannerHeader from "../BannerHeader";
import SubcategoryBanner from "../banners/SubcategoryBanner";
import { useLanguage } from "../LanguageProvider";
import { useFavorites } from "../favorites/FavoritesContext";
import { useTranslatedTexts } from "@/hooks/useTranslation";

const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='100%25' height='100%25' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23718096' font-family='Arial, sans-serif' font-size='14'%3ENo Image%3C/text%3E%3C/svg%3E";

// Copy Link Icon Component
function CopyLinkButton({ url }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center justify-center p-1 bg-transparent border-none outline-none cursor-pointer transition-all duration-200 hover:scale-110 focus:outline-none"
      aria-label={copied ? "Enlace copiado" : "Copiar enlace"}
      title={copied ? "¡Enlace copiado!" : "Copiar enlace"}
    >
      <svg
        className="h-[16px] w-[16px] transition-colors duration-200"
        viewBox="0 0 24 24"
        fill="none"
        stroke={copied ? "#22c55e" : "#1e293b"}
        strokeWidth="2"
      >
        {copied ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        )}
      </svg>
    </button>
  );
}

// Mini Favorite Star for Cards
function CardFavoriteButton({ articleSlug, articleData }) {
  const { isFavorite, toggleFavorite, isLoaded } = useFavorites();
  const isFav = isFavorite(articleSlug);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite({
      slug: articleSlug,
      ...articleData,
    });
  };

  if (!isLoaded) {
    return <div className="h-[16px] w-[16px]" aria-hidden="true" />;
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center justify-center p-1 bg-transparent border-none outline-none cursor-pointer transition-all duration-200 hover:scale-110 focus:outline-none"
      aria-label={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
      title={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
    >
      <svg
        className="h-[16px] w-[16px] transition-all duration-300 ease-out"
        viewBox="0 0 24 24"
        fill={isFav ? "#00BFFF" : "none"}
        stroke="#00BFFF"
        strokeWidth={isFav ? 0 : 2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
        />
      </svg>
    </button>
  );
}

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

  // Extract titles for batch translation
  const postTitles = useMemo(() => (posts || []).map(post => post.title || ""), [posts]);
  const translatedTitles = useTranslatedTexts(postTitles);

  const localizedPosts = useMemo(
    () =>
      (posts || []).map((post, idx) => ({
        ...post,
        title: language === "EN" ? translatedTitles[idx] || post.title : post.title,
        excerpt: post.excerpt ?? "Vista previa corta aquí...",
        date: post.date ?? "Noviembre 2025",
      })),
    [posts, language, translatedTitles]
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
              const articleHref = post.category && post.subcategory ? `/${post.category}/${post.subcategory}/articulo/${post.slug}` : `/articulo/${post.slug}`;
              const fullUrl = typeof window !== "undefined" ? `${window.location.origin}${articleHref}` : articleHref;
              const articleData = {
                title: post.title,
                excerpt: post.excerpt,
                image: post.image,
                date: post.dateISO || post.date,
                category: post.category,
                subcategory: post.subcategory,
              };

              return (
                <Link key={post.slug} href={articleHref} className="block group">
                  {/* Mobile: Vertical card (favorites style) */}
                  <article className="relative md:hidden flex flex-col overflow-hidden rounded-xl border border-slate-200/60 bg-white/80 shadow-md shadow-slate-900/5 transition hover:shadow-lg hover:border-[#00BFFF]/60 dark:border-slate-800/70 dark:bg-slate-900/70 dark:hover:border-[#33ceff]/60">
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <Image
                        src={post.image || placeholderImage}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="100vw"
                      />
                    </div>
                    <div className="flex flex-col p-4">
                      <h2 className="font-sans text-sm font-semibold leading-snug text-slate-900 transition-colors group-hover:text-[#00BFFF] dark:text-slate-50 dark:group-hover:text-[#33ceff] line-clamp-2">
                        {post.title}
                      </h2>
                      {post.excerpt && (
                        <p className="mt-2 font-serif text-xs leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-2">
                          {post.excerpt}
                        </p>
                      )}
                      <div className="mt-3 flex items-center gap-1.5 text-[7.5px] font-sans pr-16">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          por: Tripoli Publishing House
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">|</span>
                        <time className="text-slate-500 dark:text-slate-400 truncate">
                          {formattedDate}
                        </time>
                      </div>
                    </div>
                    {/* Mobile Action Icons */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-1 z-10">
                      <CopyLinkButton url={fullUrl} />
                      <span className="h-4 w-px bg-slate-300 dark:bg-slate-600" />
                      <CardFavoriteButton articleSlug={post.slug} articleData={articleData} />
                    </div>
                  </article>

                  {/* Desktop: Horizontal card (redesigned edge-to-edge) */}
                  <article className="relative hidden md:flex flex-row h-[180px] overflow-hidden rounded-xl border border-slate-200/60 bg-white/80 shadow-md shadow-slate-900/5 transition hover:shadow-lg hover:shadow-slate-900/10 hover:border-slate-300 dark:border-slate-800/70 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:border-slate-500 hover:border-[#00BFFF]/60 dark:hover:border-[#33ceff]/60">
                    <div className="relative w-[240px] flex-shrink-0 bg-slate-200 dark:bg-slate-800 h-full">
                      <Image
                        src={post.image || placeholderImage}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-500 hover:scale-105"
                        sizes="240px"
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-center gap-2 p-4 pr-12">
                      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 group-hover:text-[#00BFFF] dark:group-hover:text-[#33ceff] line-clamp-2">
                        {post.title}
                      </h2>
                      <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                        {post.excerpt}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-[11px] font-sans">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 tracking-wide">
                          por: Tripoli Publishing House
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">|</span>
                        <time className="text-slate-500 dark:text-slate-400">
                          {formattedDate}
                        </time>
                      </div>
                    </div>
                    {/* Desktop Action Icons */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-1 z-10">
                      <CopyLinkButton url={fullUrl} />
                      <span className="h-4 w-px bg-slate-300 dark:bg-slate-600" />
                      <CardFavoriteButton articleSlug={post.slug} articleData={articleData} />
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
