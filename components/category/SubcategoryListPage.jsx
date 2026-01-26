"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import BannerHeader from "../BannerHeader";
import SubcategoryBanner from "../banners/SubcategoryBanner";
import { useLanguage } from "../LanguageProvider";

const defaultFetcher = async (category, subcategory, { order = "date_desc", limit = 50 } = {}) => {
  const placeholderImage =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='200'%3E%3Crect width='100%25' height='100%25' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23718096' font-family='Arial, sans-serif' font-size='16'%3EConsumo%3C/text%3E%3C/svg%3E";

  const sample = Array.from({ length: 12 }).map((_, idx) => {
    const baseDate = new Date(2025, 10, 25 - idx);
    const isoDate = baseDate.toISOString().split("T")[0];
    return {
      title: `Placeholder Title ${idx + 1}`,
      titleEs: `Titulo ${idx + 1}`,
      excerpt: "Short preview text here...",
      excerptEs: "Vista previa corta aqui...",
      date: isoDate,
      dateEs: "Noviembre 2025",
      image: placeholderImage,
      slug: `${subcategory}-${idx + 1}`,
      category,
      subcategory,
    };
  });

  const sorted = sample.sort((a, b) => (new Date(b.date) - new Date(a.date)) || 0);
  return sorted.slice(0, limit);
};

export default function SubcategoryListPage({
  title,
  titleEs,
  categorySlug,
  subcategorySlug,
  barColor = "#f39200",
  gradientFrom = "#fce2bf",
  gradientMid,
  fetchPosts = defaultFetcher,
  BannerComponent = SubcategoryBanner,
}) {
  const { language } = useLanguage();
  const [posts, setPosts] = useState([]);
  const [showAll, setShowAll] = useState(false);

  const INITIAL_LIMIT = 10;

  useEffect(() => {
    fetchPosts(categorySlug, subcategorySlug, { order: "date_desc", limit: 50 }).then(setPosts).catch(() => setPosts([]));
  }, [categorySlug, subcategorySlug, fetchPosts]);

  const localizedPosts = useMemo(
    () =>
      (posts || []).map((post, idx) =>
        language === "EN"
          ? post
          : {
              ...post,
              title: post.titleEs ?? `T\u30f4tulo ${idx + 1}`,
              excerpt: post.excerptEs ?? "Vista previa corta aqu\u30f4...",
              date: post.dateEs ?? "Noviembre 2025",
            }
      ),
    [posts, language]
  );

  const heading = language === "EN" ? title : titleEs ?? title;
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
            <h1 className="text-lg lg:text-xl font-semibold uppercase font-raleway tracking-[0.05em]" style={{ color: barColor }}>
              {heading}
            </h1>
            <div className="h-[44px] flex-1 rounded-sm subcat-bar subcat-bar--right" aria-hidden="true" style={barVars} />
          </div>

          <div className="flex flex-col gap-4">
            {visiblePosts.map((post) => (
              <Link key={post.slug} href={`/posts/${post.slug}`} className="block">
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
                  className="px-6 py-2 rounded-full border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
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
