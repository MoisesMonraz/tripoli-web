"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
function getMonthMatrix(year, month) {
  const firstDay = new Date(year, month, 1);
  const startWeekday = (firstDay.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];

  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);
  return cells;
}

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Normalize an ISO date string to YYYY-MM-DD using local timezone,
 * so the calendar day matches the displayed date (toLocaleDateString).
 */
function toDateKey(isoString) {
  const d = new Date(isoString);
  return formatDateKey(d);
}

/**
 * Format a date to the long Spanish format matching the article view header.
 * e.g. "miércoles 28 de enero del 2026"
 */
function formatFullSpanishDate(dateInput) {
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
}

export default function CalendarClient({ articles = [] }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(formatDateKey(today));
  // Group articles by date key (YYYY-MM-DD), normalizing the ISO string
  const postsByDate = useMemo(() => {
    const map = {};
    for (const article of articles) {
      if (!article.dateISO) continue;
      const key = toDateKey(article.dateISO);
      if (!map[key]) map[key] = [];
      map[key].push(article);
    }
    return map;
  }, [articles]);

  const monthCells = useMemo(() => getMonthMatrix(viewDate.getFullYear(), viewDate.getMonth()), [viewDate]);

  const selectedPosts = postsByDate[selectedDate] ?? [];

  const handlePrev = () => setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const handleNext = () => setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  const handleSelectDay = (day) => {
    if (!day) return;
    const key = `${viewDate.getFullYear()}-${`${viewDate.getMonth() + 1}`.padStart(2, "0")}-${`${day}`.padStart(2, "0")}`;
    setSelectedDate(key);
  };

  const monthName = viewDate.toLocaleString("es-MX", { month: "long" });
  const capitalizedMonth = `${monthName.charAt(0).toUpperCase()}${monthName.slice(1)}`;
  const monthLabel = `${capitalizedMonth} de ${viewDate.getFullYear()}`;
  const weekdayLabels = ["L", "M", "X", "J", "V", "S", "D"];
  const [selYear, selMonth, selDay] = selectedDate.split("-");
  const formattedSelectedDate = `${selDay}/${selMonth}/${selYear}`;

  const publicationsLabel = "Publicaciones";
  const noPostsLabel = "No hay artículos publicados en esta fecha.";
  const notesLabel = selectedPosts.length === 1 ? "artículo" : "artículos";

  return (
    <main className="mx-auto w-full max-w-6xl px-3 sm:px-4 lg:px-8 py-6 sm:py-10">
      <div className="flex flex-col gap-4 sm:gap-6 rounded-2xl sm:rounded-3xl border border-slate-200/70 bg-white/90 p-3 sm:p-6 shadow-lg shadow-slate-900/5 backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/80 dark:shadow-black/30 w-full">

        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
          <div>
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Calendario editorial</p>
            <h1 className="text-lg sm:text-2xl font-semibold text-slate-800 dark:text-slate-100">{monthLabel}</h1>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handlePrev}
              className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-base sm:text-lg text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-[#00BFFF] hover:text-[#00BFFF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00BFFF] active:scale-[0.99] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-[#33ceff] dark:hover:text-[#33ceff]"
              aria-label="Mes anterior"
            >
              ‹
            </button>
            <button
              onClick={handleNext}
              className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-base sm:text-lg text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-[#00BFFF] hover:text-[#00BFFF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00BFFF] active:scale-[0.99] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-[#33ceff] dark:hover:text-[#33ceff]"
              aria-label="Mes siguiente"
            >
              ›
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-[1.1fr_0.9fr] gap-4 sm:gap-6">
          {/* Calendar grid */}
          <section className="w-full rounded-xl sm:rounded-2xl border border-slate-200/70 bg-white/70 p-3 sm:p-4 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">

            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center text-[10px] sm:text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              {weekdayLabels.map((label, idx) => (
                <div key={`${label}-${idx}`}>{label}</div>
              ))}
            </div>
            <div className="mt-2 sm:mt-3 grid grid-cols-7 gap-1.5 sm:gap-2">
              {monthCells.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} className="h-9 sm:h-12 rounded-lg sm:rounded-xl bg-transparent" aria-hidden="true" />;

                const key = `${viewDate.getFullYear()}-${`${viewDate.getMonth() + 1}`.padStart(2, "0")}-${`${day}`.padStart(2, "0")}`;
                const isSelected = key === selectedDate;
                const hasArticles = Boolean(postsByDate[key]?.length);

                return (
                  <button
                    key={key}
                    onClick={() => handleSelectDay(day)}
                    className={`relative h-9 sm:h-12 rounded-lg sm:rounded-xl border text-xs sm:text-sm font-semibold transition ${isSelected
                      ? "border-[#00BFFF] bg-[#00BFFF]/10 text-[#006fa8] dark:border-[#33ceff] dark:bg-[#33ceff]/10 dark:text-[#8ad8ff]"
                      : "border-slate-200/80 bg-white text-slate-700 hover:-translate-y-[1px] hover:border-[#00BFFF] hover:text-[#00BFFF] dark:border-slate-800/80 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-[#33ceff] dark:hover:text-[#33ceff]"
                      }`}
                    aria-pressed={isSelected}
                  >
                    {day}
                    {/* Dot indicator for days with articles */}
                    {hasArticles && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-[#00BFFF] dark:bg-[#33ceff]" />
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Publications panel */}
          <section className="w-full rounded-xl sm:rounded-2xl border border-slate-200/70 bg-white/70 p-3 sm:p-4 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
            <header className="mb-2 sm:mb-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{publicationsLabel}</p>
                <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100">{formattedSelectedDate}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                {selectedPosts.length} {notesLabel}
              </span>
            </header>

            {selectedPosts.length === 0 ? (
              <div className="rounded-lg sm:rounded-xl border border-dashed border-slate-300/80 bg-slate-50/70 p-3 sm:p-4 text-xs sm:text-sm text-slate-500 dark:border-slate-700/80 dark:bg-slate-800/60 dark:text-slate-300">
                {noPostsLabel}
              </div>
            ) : (
              <ul className="space-y-2 sm:space-y-3">
                {selectedPosts.map((post) => {
                  const catLabel = post.categoryName || post.category?.replace(/-/g, " ") || "";
                  const subLabel = post.subcategoryName || post.subcategory?.replace(/-/g, " ") || "";
                  const longDate = formatFullSpanishDate(post.dateISO);

                  return (
                    <li key={post.slug}>
                      <Link
                        href={`/${post.category}/${post.subcategory}/articulo/${post.slug}`}
                        className="block rounded-lg sm:rounded-xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#00BFFF] hover:shadow-md dark:border-slate-700/80 dark:bg-slate-900 dark:hover:border-[#33ceff]"
                      >
                        {/* Category / Subcategory — matches article view header */}
                        <div className="flex items-center gap-1.5 text-[7.5px] sm:text-[9px] font-bold uppercase tracking-[0.2em]">
                          {catLabel && (
                            <span className="text-[#00BFFF] dark:text-[#33ceff]">{catLabel}</span>
                          )}
                          {catLabel && subLabel && (
                            <span className="text-slate-300 dark:text-slate-600">/</span>
                          )}
                          {subLabel && (
                            <span className="text-[#00BFFF] dark:text-[#33ceff]">{subLabel}</span>
                          )}
                        </div>

                        <p className="mt-1 text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-50">{post.title}</p>

                        {/* Author + Date — matches article view header */}
                        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] sm:text-xs font-sans text-slate-500 dark:text-slate-400">
                          <span className="font-semibold text-slate-700 dark:text-slate-200">
                            {post.slug === "la-reforma-de-las-40-horas-justicia-social-y-el-reto-de-la-supervivencia-pyme" ? "Emiliano Méndez Alonso" : "Tripoli Publishing House"}
                          </span>
                          <span className="text-slate-300 dark:text-slate-600">|</span>
                          <time dateTime={post.dateISO}>{longDate}</time>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
