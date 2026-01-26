"use client";

import { useLanguage } from "../LanguageProvider";
import NewsCardHorizontal from "./NewsCardHorizontal";

export default function NewsCarousel({ posts = [], compact = false }) {
  const { language } = useLanguage();
  const items = posts.slice(0, 6);

  if (items.length === 0) {
    const emptyLabel = language === "EN" ? "No news available." : "No hay noticias disponibles.";
    return (
      <div className="rounded-xl border border-slate-200/60 bg-white/70 p-6 text-sm text-slate-500 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/70 dark:text-slate-300">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        className={`flex gap-4 overflow-x-auto ${compact ? "pb-0" : "pb-2"} pr-2 snap-x snap-mandatory scrollbar-hide`}
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
