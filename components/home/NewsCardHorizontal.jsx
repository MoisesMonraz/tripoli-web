"use client";

import Image from "next/image";
import Link from "next/link";

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

export default function NewsCardHorizontal({ title, excerpt, image, date, dateISO, slug, category, subcategory }) {
  const isPlaceholder = slug?.startsWith("placeholder-");
  const articleHref = category && subcategory
    ? `/${category}/${subcategory}/articulo/${slug}`
    : `/articulo/${slug}`;
  const formattedDate =
    formatFullSpanishDate(dateISO) || formatFullSpanishDate(date) || date || "";

  return (
    <article className="flex w-[175px] h-[220px] flex-col items-stretch gap-2 overflow-hidden md:w-[500px] md:h-[250px] md:flex-row md:items-center md:gap-4 md:overflow-visible rounded-xl border border-slate-200/60 bg-white/80 p-3 md:p-5 shadow-md shadow-slate-900/5 transition hover:border-[#00BFFF]/60 hover:shadow-lg hover:shadow-slate-900/10 dark:border-slate-800/70 dark:bg-slate-900/70 dark:hover:border-[#33ceff]/60">
      <div className="relative h-[80px] w-full md:h-[200px] md:w-[200px] flex-shrink-0 overflow-hidden bg-slate-200 dark:bg-slate-800">
        <Image src={image} alt={title} fill className="object-cover" sizes="(max-width: 768px) 175px, 220px" />
      </div>
      <div className="flex flex-1 flex-col items-start md:items-start text-left md:text-left justify-center md:justify-start gap-1.5 md:gap-1 overflow-hidden pt-0">
        {isPlaceholder ? (
          <h3 className="text-[8px] leading-tight md:text-[11.5px] md:leading-snug font-semibold text-slate-900 dark:text-slate-50 md:line-clamp-4">
            {title}
          </h3>
        ) : (
          <Link
            href={articleHref}
            className="text-[8px] leading-tight md:text-[11.5px] md:leading-snug font-semibold text-slate-900 transition hover:text-[#00BFFF] dark:text-slate-50 dark:hover:text-[#33ceff] md:line-clamp-4"
          >
            {title}
          </Link>
        )}
        <p className="hidden md:block text-[0.65rem] leading-tight md:text-sm md:leading-snug text-slate-600 dark:text-slate-300 md:line-clamp-3">{excerpt}</p>
        <span className="mt-0 md:mt-0 text-[8px] md:text-[0.72rem] font-sans font-semibold text-slate-800 dark:text-slate-200">
          por: Tripoli Publishing House
        </span>
        <time className="text-[8px] md:text-[0.72rem] font-sans text-slate-500 dark:text-slate-400" dateTime={dateISO || date}>
          {formattedDate}
        </time>
      </div>
    </article>
  );
}
