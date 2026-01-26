"use client";

import Link from "next/link";
import { useLanguage } from "./LanguageProvider";
import NewsCarousel from "./home/NewsCarousel";
import BannerFabricantesProveedores from "./banners/BannerFabricantesProveedores";

export default function CategorySectionFabricantes({ posts }) {
  const { language } = useLanguage();
  const heading = language === "EN" ? "Manufacturers & Suppliers" : "Fabricantes y Proveedores";
  const newsLabel = language === "EN" ? "Latest news" : "Últimas noticias";

  const localizedPosts = (posts || []).map((post, idx) =>
    language === "EN"
      ? post
      : {
          ...post,
          title: post.titleEs ?? `Título ${idx + 1}`,
          excerpt: post.excerptEs ?? "Vista previa corta aquí...",
          date: post.dateEs ?? "Noviembre 2025",
        }
  );

  return (
    <section className="flex flex-col gap-2 px-4 max-w-[70rem] mx-auto w-full sm:px-[12px] md:px-4">
      <div className="flex items-center justify-between">
        <div className="flex items-stretch gap-0">
          <span className="h-[44px] w-[8px]" style={{ backgroundColor: "#fdc652" }} aria-hidden="true" />
          <Link
            href="/categoria/consumo-y-retail"
            className="group"
            style={{
              "--bg": "#f39200",
              "--bg-hover": "#935b00",
              "--bg-active": "#935b00",
              "--text": "#fee5c8",
            }}
          >
            <h1
              className="
                flex h-[44px] items-center px-3 
                rounded-r-lg rounded-l-none 
                text-lg lg:text-xl font-semibold uppercase 
                tracking-[0.05em] transition-colors
                text-[var(--text)]
                bg-[var(--bg)]
                group-hover:bg-[var(--bg-hover)]
                group-active:bg-[var(--bg-active)]
              "
            >
              {heading}
            </h1>
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-[14px] font-bold uppercase tracking-[0.08em] text-slate-700 dark:text-slate-200">
          {newsLabel}
        </p>
        <NewsCarousel posts={localizedPosts} compact />
      </div>

      <BannerFabricantesProveedores />
    </section>
  );
}
