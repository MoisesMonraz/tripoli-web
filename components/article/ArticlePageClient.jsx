"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "../LanguageProvider";
import ArticleContent from "./ArticleContent";
import SocialShareBar from "./SocialShareBar";
import { getCachedTranslation, saveCachedTranslation } from "../../lib/translationCache";

/**
 * Extract all text nodes from Rich Text for translation
 */
function collectTextsFromRichText(node, texts) {
  if (!node || typeof node !== "object") return;
  if (node.nodeType === "text" && node.value?.trim()) {
    texts.push(node.value);
  }
  if (Array.isArray(node.content)) {
    node.content.forEach((child) => collectTextsFromRichText(child, texts));
  }
}

/**
 * Replace text nodes in Rich Text with translations
 */
function applyTranslationsToRichText(node, translationMap) {
  if (!node || typeof node !== "object") return node;

  if (node.nodeType === "text" && node.value?.trim()) {
    return {
      ...node,
      value: translationMap.get(node.value) || node.value,
    };
  }

  if (Array.isArray(node.content)) {
    return {
      ...node,
      content: node.content.map((child) =>
        applyTranslationsToRichText(child, translationMap)
      ),
    };
  }

  return node;
}

/**
 * Format date based on language
 */
const formatDate = (dateInput, language = "ES") => {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "";

  const locale = language === "EN" ? "en-US" : "es-MX";
  const formatter = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (language === "EN") {
    return formatter.format(date);
  }

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
    <figure className="mx-auto mt-5 max-w-3xl px-5 sm:px-6 md:mt-8 lg:px-0">
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
        <figcaption className="mt-3 w-full text-center font-sans text-sm leading-snug text-slate-500 dark:text-slate-400">
          {caption}
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
    <div className="mx-auto mt-6 max-w-3xl px-5 sm:px-6 md:mt-10 lg:px-0">
      <ArticleContent content={content} className={`article-body ${className}`} />
    </div>
  );
};

// Category translations
const categoryTranslations = {
  "consumo-y-retail": { ES: "Consumo y Retail", EN: "Consumer & Retail" },
  "entretenimiento-y-cultura": { ES: "Entretenimiento y Cultura", EN: "Entertainment & Culture" },
  "industria-ti": { ES: "Industria TI", EN: "IT Industry" },
  "infraestructura-social": { ES: "Infraestructura Social", EN: "Social Infrastructure" },
  "politica-y-leyes": { ES: "Politica y Leyes", EN: "Politics & Law" },
  "sector-salud": { ES: "Sector Salud", EN: "Health Sector" },
};

const subcategoryTranslations = {
  "fabricantes-y-proveedores": { ES: "Fabricantes y Proveedores", EN: "Manufacturers & Suppliers" },
  "cadenas-comerciales": { ES: "Cadenas Comerciales", EN: "Retail Chains" },
  "tiendas-de-conveniencia": { ES: "Tiendas de Conveniencia", EN: "Convenience Stores" },
  "productoras-de-contenido": { ES: "Productoras de Contenido", EN: "Content Producers" },
  "recintos-culturales": { ES: "Recintos Culturales", EN: "Cultural Venues" },
  "festivales-eventos-y-artistas": { ES: "Festivales, Eventos y Artistas", EN: "Festivals, Events & Artists" },
  "fabricantes-de-tecnologia": { ES: "Fabricantes de Tecnologia", EN: "Technology Manufacturers" },
  "mayoristas-ti": { ES: "Mayoristas TI", EN: "IT Wholesalers" },
  "canales-de-distribucion": { ES: "Canales de Distribucion", EN: "Distribution Channels" },
  "proveedores-de-materiales": { ES: "Proveedores de Materiales", EN: "Materials Suppliers" },
  "desarrolladores-de-proyectos": { ES: "Desarrolladores de Proyectos", EN: "Project Developers" },
  "promotores-inmobiliarios": { ES: "Promotores Inmobiliarios", EN: "Real Estate Developers" },
  "organismos-publicos": { ES: "Organismos Publicos", EN: "Public Agencies" },
  "administracion-publica": { ES: "Administracion Publica", EN: "Public Administration" },
  "servicios-juridicos": { ES: "Servicios Juridicos", EN: "Legal Services" },
  "fabricantes-equipos-insumos": { ES: "Fabricantes de Equipo e Insumos", EN: "Equipment & Supplies Manufacturers" },
  "instituciones-de-salud": { ES: "Instituciones de Salud", EN: "Healthcare Institutions" },
  "especialistas-medicos": { ES: "Especialistas Medicos", EN: "Medical Specialists" },
};

// Cache key for localStorage
const getCacheKey = (slug) => `tm_article_translation_${slug}`;

/**
 * ArticlePageClient - Full article page with automatic AI translation
 */
export default function ArticlePageClient({
  initialArticle,
  slug,
  categorySlug,
  subcategorySlug,
}) {
  const { language } = useLanguage();
  const [article, setArticle] = useState(initialArticle);
  const [isLoading, setIsLoading] = useState(false);
  const [translationError, setTranslationError] = useState(null);
  const translationCacheRef = useRef({ ES: initialArticle });

  /**
   * Translate article using Gemini API with Firebase persistent cache
   */
  const translateArticle = useCallback(async () => {
    // Check memory cache first (instant)
    if (translationCacheRef.current.EN) {
      setArticle(translationCacheRef.current.EN);
      return;
    }

    // Check Firebase cache (shared across all users)
    try {
      const firebaseCached = await getCachedTranslation(slug);
      if (firebaseCached) {
        translationCacheRef.current.EN = firebaseCached;
        setArticle(firebaseCached);
        return;
      }
    } catch (e) {
      console.error("Firebase cache check failed:", e);
    }

    // Check localStorage cache (fallback for offline)
    try {
      const cached = localStorage.getItem(getCacheKey(slug));
      if (cached) {
        const parsedCache = JSON.parse(cached);
        if (parsedCache.timestamp && Date.now() - parsedCache.timestamp < 7 * 24 * 60 * 60 * 1000) {
          translationCacheRef.current.EN = parsedCache.article;
          setArticle(parsedCache.article);
          return;
        }
      }
    } catch (e) {
      // Ignore localStorage errors
    }

    setIsLoading(true);
    setTranslationError(null);

    try {
      // Collect all texts to translate
      const textsToTranslate = [];
      const spanishArticle = translationCacheRef.current.ES || initialArticle;

      // Add title
      if (spanishArticle.title) {
        textsToTranslate.push(spanishArticle.title);
      }

      // Add excerpt
      if (spanishArticle.excerpt) {
        textsToTranslate.push(spanishArticle.excerpt);
      }

      // Add image captions (pies de foto)
      const captionFields = ["imageCaption", "image1Caption", "image2Caption", "image3Caption"];
      captionFields.forEach((field) => {
        if (spanishArticle[field]?.trim()) {
          textsToTranslate.push(spanishArticle[field]);
        }
      });

      // Collect from Rich Text fields
      const richTextFields = ["introduccion", "body1", "body2", "cierre", "fuentes"];
      richTextFields.forEach((field) => {
        if (spanishArticle[field]) {
          collectTextsFromRichText(spanishArticle[field], textsToTranslate);
        }
      });

      // Translate in batches of 20 (API limit)
      const allTranslations = [];
      for (let i = 0; i < textsToTranslate.length; i += 20) {
        const batch = textsToTranslate.slice(i, i + 20);
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texts: batch, targetLang: "EN" }),
        });

        if (!response.ok) {
          throw new Error("Translation API failed");
        }

        const data = await response.json();
        allTranslations.push(...data.translations);
      }

      // Create translation map
      const translationMap = new Map();
      textsToTranslate.forEach((text, i) => {
        if (allTranslations[i]) {
          translationMap.set(text, allTranslations[i]);
        }
      });

      // Build translated article
      const translatedArticle = {
        ...spanishArticle,
        title: translationMap.get(spanishArticle.title) || spanishArticle.title,
        excerpt: spanishArticle.excerpt
          ? translationMap.get(spanishArticle.excerpt) || spanishArticle.excerpt
          : "",
      };

      // Apply translations to image captions
      captionFields.forEach((field) => {
        if (spanishArticle[field]?.trim()) {
          translatedArticle[field] = translationMap.get(spanishArticle[field]) || spanishArticle[field];
        }
      });

      // Apply translations to Rich Text fields
      richTextFields.forEach((field) => {
        if (spanishArticle[field]) {
          translatedArticle[field] = applyTranslationsToRichText(
            spanishArticle[field],
            translationMap
          );
        }
      });

      // Cache in memory
      translationCacheRef.current.EN = translatedArticle;

      // Save to Firebase (persistent, shared across all users)
      try {
        await saveCachedTranslation(slug, translatedArticle);
      } catch (e) {
        console.error("Firebase save failed:", e);
      }

      // Also cache in localStorage (backup for offline)
      try {
        localStorage.setItem(
          getCacheKey(slug),
          JSON.stringify({
            article: translatedArticle,
            timestamp: Date.now(),
          })
        );
      } catch (e) {
        // Ignore localStorage errors
      }

      setArticle(translatedArticle);
    } catch (error) {
      console.error("Translation error:", error);
      setTranslationError("Translation failed. Showing original content.");
      setArticle(translationCacheRef.current.ES || initialArticle);
    } finally {
      setIsLoading(false);
    }
  }, [slug, initialArticle]);

  useEffect(() => {
    if (language === "ES") {
      setArticle(translationCacheRef.current.ES || initialArticle);
      setTranslationError(null);
    } else if (language === "EN") {
      translateArticle();
    }
  }, [language, translateArticle, initialArticle]);

  // Get translated category/subcategory labels
  const getCategoryLabel = () => {
    const translations = categoryTranslations[categorySlug];
    if (translations) return translations[language] || translations.ES;
    return (article.category || categorySlug || "").replace(/-/g, " ");
  };

  const getSubcategoryLabel = () => {
    const translations = subcategoryTranslations[subcategorySlug];
    if (translations) return translations[language] || translations.ES;
    return (article.subcategory || subcategorySlug || "").replace(/-/g, " ");
  };

  const categoryLabel = getCategoryLabel();
  const subcategoryLabel = getSubcategoryLabel();
  const formattedDate = formatDate(article.dateISO, language) || article.date || "";
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

          {/* Title */}
          <h1 className="font-sans text-[1.3125rem] font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-[1.64rem] md:text-[2.625rem] dark:text-slate-50">
            {article.title}
          </h1>

          {/* Excerpt / Lead */}
          {article.excerpt && (
            <p className="mt-3 font-serif text-lg leading-relaxed text-slate-600 md:mt-5 md:text-xl dark:text-slate-300">
              {article.excerpt}
            </p>
          )}

          {/* Author + Date + Share Bar */}
          <div className="mt-4 flex flex-col gap-3 border-b border-slate-200 pb-4 md:mt-6 md:flex-row md:items-center md:justify-between md:gap-4 md:pb-6 dark:border-slate-800">
            <div className="flex items-center gap-2 font-sans text-xs text-slate-500 md:gap-3 md:text-sm dark:text-slate-400">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Tripoli Publishing House
              </span>
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
        {hasModularContent ? (
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
        )}

        {/* Breadcrumb footer */}
        <footer className="mx-auto mt-6 max-w-3xl px-5 sm:px-6 md:mt-10 lg:px-0">
          <nav className="whitespace-nowrap font-sans text-[8px] text-slate-400 sm:text-[10px] dark:text-slate-500">
            <ol className="flex items-center gap-1.5">
              <li>
                <Link href="/" className="transition-colors hover:text-[#00BFFF]">
                  {language === "EN" ? "Home" : "Inicio"}
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
      </div>
    </article>
  );
}
