"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useFavorites } from "../favorites/FavoritesContext";

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

export default function NewsCardHorizontal({ title, excerpt, image, date, dateISO, slug, category, subcategory }) {
  const isPlaceholder = slug?.startsWith("placeholder-");
  const articleHref = category && subcategory
    ? `/${category}/${subcategory}/articulo/${slug}`
    : `/articulo/${slug}`;

  const displayTitle = title;

  const formattedDate =
    formatFullSpanishDate(dateISO) || formatFullSpanishDate(date) || date || "";

  // Full URL for copy feature
  const fullUrl = typeof window !== "undefined"
    ? `${window.location.origin}${articleHref}`
    : articleHref;

  // Article data for favorites
  const articleData = {
    title,
    excerpt,
    image,
    date: dateISO || date,
    category,
    subcategory,
  };

  return (
    <>
      {/* Mobile Layout - Vertical card */}
      <article className="relative flex md:hidden w-[175px] h-[220px] flex-col items-stretch gap-0 overflow-hidden rounded-xl border border-slate-200/60 bg-white/80 shadow-md shadow-slate-900/5 transition hover:border-[#00BFFF]/60 hover:shadow-lg hover:shadow-slate-900/10 dark:border-slate-800/70 dark:bg-slate-900/70 dark:hover:border-[#33ceff]/60">
        <div className="relative h-[100px] w-full flex-shrink-0 overflow-hidden rounded-t-xl bg-slate-200 dark:bg-slate-800 transition-transform duration-300 ease-out hover:scale-105">
          {isPlaceholder ? (
            <Image src={image} alt={title} fill className="object-cover" sizes="175px" />
          ) : (
            <Link href={articleHref} className="block relative w-full h-full">
              <Image src={image} alt={title} fill className="object-cover" sizes="175px" />
            </Link>
          )}
        </div>
        <div className="flex flex-1 flex-col justify-between overflow-hidden px-3 py-2">
          {/* Top: Title */}
          <div className="flex items-start">
            {isPlaceholder ? (
              <h3 className="text-[8px] leading-tight font-semibold text-slate-900 dark:text-slate-50 line-clamp-3">{displayTitle}</h3>
            ) : (
              <Link href={articleHref} className="text-[8px] leading-tight font-semibold text-slate-900 transition hover:text-[#00BFFF] dark:text-slate-50 dark:hover:text-[#33ceff] line-clamp-3">
                {displayTitle}
              </Link>
            )}
          </div>

          {/* Bottom: Metadata + Actions */}
          <div className="flex items-end justify-between w-full mt-1">
            <div className="flex flex-col gap-0.5">
              <span className="text-[5.25px] font-sans font-semibold text-slate-800 dark:text-slate-200 leading-none">
                por: Tripoli Publishing House
              </span>
              <time className="text-[5.25px] font-sans text-slate-500 dark:text-slate-400 leading-none" dateTime={dateISO || date}>
                {formattedDate}
              </time>
            </div>

            {/* Actions */}
            {!isPlaceholder && (
              <div className="flex items-center gap-0.5 shrink-0 mb-0.5">
                <CopyLinkButton url={fullUrl} />
                <span className="h-3 w-px bg-slate-300 dark:bg-slate-600 mx-0.5" />
                <CardFavoriteButton articleSlug={slug} articleData={articleData} />
              </div>
            )}
          </div>
        </div>
      </article>

      {/* Desktop Layout - Horizontal card with image flush to edges */}
      <article className="relative hidden md:flex w-[460px] h-[200px] flex-row items-stretch overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-md shadow-slate-900/5 transition hover:border-[#00BFFF]/60 hover:shadow-lg hover:shadow-slate-900/10 dark:border-slate-800/70 dark:bg-slate-900 dark:hover:border-[#33ceff]/60">
        {/* Image - flush to top, bottom, left edges */}
        <div className="relative h-full w-[200px] flex-shrink-0 overflow-hidden bg-slate-200 dark:bg-slate-800">
          {isPlaceholder ? (
            <Image src={image} alt={title} fill className="object-cover transition-transform duration-300 ease-out hover:scale-105" sizes="200px" />
          ) : (
            <Link href={articleHref} className="block relative w-full h-full">
              <Image src={image} alt={title} fill className="object-cover transition-transform duration-300 ease-out hover:scale-105" sizes="200px" />
            </Link>
          )}
        </div>
        {/* Text area - with padding, white background on right */}
        <div className="flex flex-1 flex-col items-start text-left justify-center gap-1 overflow-hidden px-4 py-3">
          {isPlaceholder ? (
            <h3 className="text-[11.5px] leading-snug font-semibold text-slate-900 dark:text-slate-50 line-clamp-3">{displayTitle}</h3>
          ) : (
            <Link href={articleHref} className="text-[11.5px] leading-snug font-semibold text-slate-900 transition hover:text-[#00BFFF] dark:text-slate-50 dark:hover:text-[#33ceff] line-clamp-3">
              {displayTitle}
            </Link>
          )}
          <p className="text-[11px] leading-snug text-slate-600 dark:text-slate-300 line-clamp-2">{excerpt}</p>
          <span className="text-[0.68rem] font-sans font-semibold text-slate-800 dark:text-slate-200">
            por: Tripoli Publishing House
          </span>
          <time className="text-[0.68rem] font-sans text-slate-500 dark:text-slate-400" dateTime={dateISO || date}>
            {formattedDate}
          </time>
        </div>
        {/* Desktop Action Icons */}
        {!isPlaceholder && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 z-10">
            <CopyLinkButton url={fullUrl} />
            <span className="h-4 w-px bg-slate-300 dark:bg-slate-600" />
            <CardFavoriteButton articleSlug={slug} articleData={articleData} />
          </div>
        )}
      </article>
    </>
  );
}
