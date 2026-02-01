"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import BannerHeader from "../BannerHeader";
import SubcategoryBanner from "../banners/SubcategoryBanner";
import { useLanguage } from "../LanguageProvider";

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
  const isFabricantesEquipoInsumos = subcategorySlug === "fabricantes-equipo-insumos";
  const headingClassName = isFabricantesEquipoInsumos
    ? "text-[12.5px] sm:text-lg lg:text-xl"
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
            {visiblePosts.map((post) => (
              <Link key={post.slug} href={post.category && post.subcategory ? `/${post.category}/${post.subcategory}/articulo/${post.slug}` : `/articulo/${post.slug}`} className="block">
                <article
                  className="flex gap-6 p-5 rounded-xl border border-slate-200 shadow-sm bg-white transition hover:shadow-md hover:border-slate-300
                  dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-500 dark:shadow-none"
                >
                  <div className="w-[160px] h-[120px] bg-slate-200 rounded-md flex items-center justify-center text-slate-500 text-sm">
                    Imagen
                  </div>
                  <div className="flex flex-col justify-center gap-1">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{post.title}</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{post.excerpt}</p>
                    <span className="text-xs uppercase tracking-widest text-slate-400 dark:text-slate-500">{post.date}</span>
                  </div>
                </article>
              </Link>
            ))}
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
