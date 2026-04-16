"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import ArticleContent from "./ArticleContent";
import SocialShareBar from "./SocialShareBar";
// Renders author name as a link if the author has a slug, plain text otherwise
function AuthorDisplay({ author }) {
  if (!author?.name) return null;
  if (author.slug) {
    return (
      <Link
        href={`/${author.slug}`}
        className="font-semibold text-slate-800 dark:text-slate-200 hover:text-[#009fe3] hover:underline transition-colors"
      >
        {author.name}
      </Link>
    );
  }
  return <span className="font-semibold text-slate-800 dark:text-slate-200">{author.name}</span>;
}

/**
 * Format date in Spanish
 */
const formatDate = (dateInput) => {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "";

  const formatter = new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const parts = formatter.formatToParts(date).reduce((acc, part) => {
    if (part.type !== "literal") acc[part.type] = part.value;
    return acc;
  }, {});

  if (parts.weekday && parts.day && parts.month && parts.year) {
    return `${parts.weekday} ${parts.day} de ${parts.month} del ${parts.year}`;
  }
  return formatter.format(date);
};

/**
 * Format category labels with proper casing for "TI"
 */
const formatCategoryLabel = (label) => {
  if (!label) return "";
  return label.replace(/\bti\b/gi, "TI");
};

/**
 * ArticleImage component
 */
const ArticleImage = ({ src, alt, caption, priority = false }) => {
  if (!src) return null;
  return (
    <figure className="mx-auto mt-4 max-w-3xl px-5 sm:px-6 md:mt-5 lg:px-0">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md">
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 768px"
          quality={85}
        />
      </div>
      {caption && (
        <figcaption className="mt-3 w-full text-center font-sans text-sm max-md:text-[10.5px] leading-snug text-slate-500 dark:text-slate-400">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};

/**
 * ImageCarousel component — renders a multi-image carousel (image4 field)
 */
const ImageCarousel = ({ images }) => {
  const [current, setCurrent] = React.useState(0);
  if (!images?.length) return null;
  if (images.length === 1) {
    return (
      <ArticleImage
        src={images[0].url}
        alt={images[0].caption || "Imagen del artículo"}
        caption={images[0].caption}
      />
    );
  }
  const prev = () => setCurrent((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setCurrent((i) => (i === images.length - 1 ? 0 : i + 1));
  return (
    <figure className="mx-auto mt-4 max-w-3xl px-5 sm:px-6 md:mt-5 lg:px-0">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
        {images.map((img, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-500 ${idx === current ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          >
            <Image
              src={img.url}
              alt={img.caption || `Imagen ${idx + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              quality={85}
            />
          </div>
        ))}
        {/* Prev button */}
        <button
          onClick={prev}
          aria-label="Imagen anterior"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        {/* Next button */}
        <button
          onClick={next}
          aria-label="Siguiente imagen"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
        {/* Counter */}
        <span className="absolute bottom-2 right-3 z-10 rounded-full bg-black/40 px-2 py-0.5 font-sans text-[10px] text-white">
          {current + 1} / {images.length}
        </span>
      </div>
      {/* Dots */}
      <div className="mt-3 flex justify-center gap-1.5">
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            aria-label={`Ir a imagen ${idx + 1}`}
            className={`h-1.5 rounded-full transition-all ${idx === current ? "w-4 bg-slate-600 dark:bg-slate-300" : "w-1.5 bg-slate-300 dark:bg-slate-600"}`}
          />
        ))}
      </div>
      {/* Caption for current image */}
      {images[current]?.caption && (
        <figcaption className="mt-2 w-full text-center font-sans text-sm max-md:text-[10.5px] leading-snug text-slate-500 dark:text-slate-400">
          {images[current].caption}
        </figcaption>
      )}
    </figure>
  );
};

/**
 * ContentBlock component
 */
const ContentBlock = ({ content, className = "" }) => {
  if (!content) return null;
  return (
    <div className="mx-auto mt-4 max-w-3xl px-5 sm:px-6 md:mt-6 lg:px-0">
      <ArticleContent content={content} className={`article-body ${className}`} />
    </div>
  );
};

// Category translations
const categoryTranslations = {
  "consumo-y-retail": "Consumo y Retail",
  "entretenimiento-y-cultura": "Entretenimiento y Cultura",
  "industria-ti": "Industria TI",
  "infraestructura-social": "Infraestructura Social",
  "politica-y-leyes": "Politica y Leyes",
  "sector-salud": "Sector Salud",
};

const subcategoryTranslations = {
  "fabricantes-y-proveedores": "Fabricantes y Proveedores",
  "cadenas-comerciales": "Cadenas Comerciales",
  "negocios-de-conveniencia": "Negocios de Conveniencia",
  "productoras-de-contenido": "Productoras de Contenido",
  "promotores-culturales": "Promotores Culturales",
  "festivales-eventos-y-artistas": "Festivales, Eventos y Artistas",
  "fabricantes-de-tecnologia": "Fabricantes de Tecnologia",
  "mayoristas-ti": "Mayoristas TI",
  "canales-de-distribucion": "Canales de Distribucion",
  "proveedores-de-materiales": "Proveedores de Materiales",
  "desarrolladores-de-proyectos": "Desarrolladores de Proyectos",
  "promotores-inmobiliarios": "Promotores Inmobiliarios",
  "organismos-publicos": "Organismos Publicos",
  "administracion-publica": "Administracion Publica",
  "servicios-juridicos": "Servicios Juridicos",
  "fabricantes-equipos-insumos": "Fabricantes de Equipo e Insumos",
  "instituciones-de-salud": "Instituciones de Salud",
  "especialistas-medicos": "Especialistas Medicos",
};

/**
 * ArticlePageClient - Full article page with automatic AI translation
 */
export default function ArticlePageClient({
  initialArticle,
  slug,
  categorySlug,
  subcategorySlug,
}) {
  const article = initialArticle;
  const isLoading = false;
  const translationError = null;

  // Get category/subcategory labels
  const categoryLabel = categoryTranslations[categorySlug] || (article.category || categorySlug || "").replace(/-/g, " ");
  const subcategoryLabel = subcategoryTranslations[subcategorySlug] || (article.subcategory || subcategorySlug || "").replace(/-/g, " ");
  const formattedDate = formatDate(article.dateISO) || article.date || "";
  const hasModularContent = article.introduccion || article.body1 || article.body2;

  return (
    <article>
      {/* Loading indicator */}
      {isLoading && (
        <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-[#00BFFF]" />
            <span className="text-sm text-slate-600 dark:text-slate-300">
              Translating with AI...
            </span>
          </div>
        </div>
      )}

      {/* Error message */}
      {translationError && (
        <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 shadow-lg dark:border-amber-700 dark:bg-amber-900/50">
          <span className="text-sm text-amber-700 dark:text-amber-300">
            {translationError}
          </span>
        </div>
      )}

      <div
        className={`transition-opacity duration-300 ${isLoading ? "opacity-60" : "opacity-100"}`}
      >
        {/* Header section */}
        <header className="mx-auto mt-6 max-w-3xl px-5 sm:px-6 md:mt-10 lg:px-0">
          {/* Category + Subcategory label */}
          <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] md:mb-4 md:text-xs">
            {categoryLabel && (
              <Link
                href={`/categoria/${categorySlug}`}
                className="text-[#00BFFF] transition-colors hover:text-[#0099CC]"
              >
                {categoryLabel}
              </Link>
            )}
            {categoryLabel && subcategoryLabel && (
              <span className="text-slate-300 dark:text-slate-600">/</span>
            )}
            {subcategoryLabel && (
              <Link
                href={`/categoria/${categorySlug}/${subcategorySlug}`}
                className="text-[#00BFFF] transition-colors hover:text-[#0099CC]"
              >
                {subcategoryLabel}
              </Link>
            )}
          </div>

          <h1 className="font-sans text-[1.3125rem] font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-[1.64rem] md:text-[2.625rem] dark:text-slate-50">
            {article.title}
          </h1>

          {/* Subtitle */}
          {article.subtitle && (
            <p className="mt-2 text-sm font-medium text-slate-500 md:text-base dark:text-slate-400">
              {article.subtitle}
            </p>
          )}

          {/* Excerpt / Lead */}
          {article.excerpt && (
            <p className="mt-3 font-serif text-lg leading-relaxed text-slate-600 md:mt-5 md:text-xl dark:text-slate-300">
              {article.excerpt}
            </p>
          )}

          {/* Author + Date + Share Bar */}
          <div className="mt-4 flex flex-col gap-2 border-b border-slate-200 pb-3 md:mt-5 md:flex-row md:items-center md:justify-between md:gap-4 md:pb-4 dark:border-slate-800">
            <div className="flex items-center gap-2 font-sans text-xs text-slate-500 md:gap-3 md:text-sm dark:text-slate-400">
              <AuthorDisplay author={article.author} />
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <time dateTime={article.dateISO || article.date}>{formattedDate}</time>
            </div>
            <SocialShareBar
              title={article.title}
              articleSlug={slug}
              articleData={{
                title: article.title,
                excerpt: article.excerpt,
                image: article.image,
                category: categorySlug,
                subcategory: subcategorySlug,
                date: article.dateISO || article.date,
              }}
            />
          </div>
        </header>

        {/* Article Body */}
        {
          hasModularContent ? (
            <>
              <ContentBlock content={article.introduccion} />
              <ArticleImage
                src={article.image1 || article.image}
                alt={article.image1Caption || article.imageCaption || article.title}
                caption={article.image1Caption || article.imageCaption}
                priority
              />
              <ContentBlock content={article.body1} className="article-body--no-dropcap" />
              <ArticleImage
                src={article.image2}
                alt={article.image2Caption || `${article.title} - imagen 2`}
                caption={article.image2Caption}
              />
              <ContentBlock content={article.body2} className="article-body--no-dropcap" />
              <ArticleImage
                src={article.image3}
                alt={article.image3Caption || `${article.title} - imagen 3`}
                caption={article.image3Caption}
              />
              <ContentBlock content={article.cierre} className="article-body--no-dropcap" />
              {article.image4?.length > 0 && (
                <ImageCarousel images={article.image4} />
              )}
              {article.fuentes && (
                <div className="mx-auto mt-8 max-w-3xl px-5 sm:px-6 md:mt-12 lg:px-0">
                  <div className="border-t border-slate-200 pt-6 dark:border-slate-800">
                    <ArticleContent
                      content={article.fuentes}
                      className="article-body article-body--sources text-sm"
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <ArticleImage
                src={article.image}
                alt={article.imageCaption || article.title}
                caption={article.imageCaption}
                priority
              />
              <ContentBlock content={article.content} />
            </>
          )
        }

        {/* Breadcrumb footer */}
        <footer className="mx-auto mt-6 max-w-3xl px-5 sm:px-6 md:mt-10 lg:px-0">
          <nav className="whitespace-nowrap font-sans text-[8px] text-slate-400 sm:text-[10px] dark:text-slate-500">
            <ol className="flex items-center gap-1.5">
              <li>
                <Link href="/" className="transition-colors hover:text-[#00BFFF]">
                  Inicio
                </Link>
              </li>
              <li className="text-slate-300 dark:text-slate-600">/</li>
              {categoryLabel && (
                <>
                  <li>
                    <Link
                      href={`/categoria/${categorySlug}`}
                      className="capitalize transition-colors hover:text-[#00BFFF]"
                    >
                      {formatCategoryLabel(categoryLabel)}
                    </Link>
                  </li>
                  <li className="text-slate-300 dark:text-slate-600">/</li>
                </>
              )}
              {subcategoryLabel && (
                <>
                  <li>
                    <Link
                      href={`/categoria/${categorySlug}/${subcategorySlug}`}
                      className="capitalize transition-colors hover:text-[#00BFFF]"
                    >
                      {formatCategoryLabel(subcategoryLabel)}
                    </Link>
                  </li>
                  <li className="text-slate-300 dark:text-slate-600">/</li>
                </>
              )}
              <li className="truncate text-slate-600 dark:text-slate-400">{article.title}</li>
            </ol>
          </nav>
        </footer>
      </div >
    </article >
  );
}
