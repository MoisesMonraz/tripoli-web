"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "../../components/LanguageProvider";

function getMonthMatrix(year, month) {
  const firstDay = new Date(year, month, 1);
  const startWeekday = (firstDay.getDay() + 6) % 7; // Lunes = 0
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

export default function CalendarPage() {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(formatDateKey(today));
  const { language } = useLanguage();
  const isEN = language === "EN";

  // Sin datos de ejemplo; estructura vacía para integrar la fuente real (Contentful/API)
  const postsByDate = useMemo(() => ({}), []);

  const monthCells = useMemo(() => getMonthMatrix(viewDate.getFullYear(), viewDate.getMonth()), [viewDate]);
  const weeks = Math.ceil(monthCells.length / 7);
  const calendarWidth = weeks >= 6 ? "650px" : "600px";
  const containerWidth = "1090px";
  const containerMinHeight = weeks >= 6 ? "430px" : "385.21px";

  const selectedPosts = postsByDate[selectedDate] ?? [];

  const handlePrev = () => setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const handleNext = () => setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  const handleSelectDay = (day) => {
    if (!day) return;
    const key = `${viewDate.getFullYear()}-${`${viewDate.getMonth() + 1}`.padStart(2, "0")}-${`${day}`.padStart(2, "0")}`;
    setSelectedDate(key);
  };

  const locale = isEN ? "en-US" : "es-MX";
  const monthName = viewDate.toLocaleString(locale, { month: "long" });
  const capitalizedMonth = `${monthName.charAt(0).toUpperCase()}${monthName.slice(1)}`;
  const monthLabel = isEN ? `${capitalizedMonth} ${viewDate.getFullYear()}` : `${capitalizedMonth} de ${viewDate.getFullYear()}`;
  const weekdayLabels = isEN ? ["M", "T", "W", "T", "F", "S", "S"] : ["L", "M", "X", "J", "V", "S", "D"];
  const [selYear, selMonth, selDay] = selectedDate.split("-");
  const formattedSelectedDate = `${selDay}/${selMonth}/${selYear}`;

  const publicationsLabel = isEN ? "Publications" : "Publicaciones";
  const noPostsLabel = isEN ? "No publications for this day." : "No hay publicaciones para este día.";
  const notesLabel = selectedPosts.length === 1 ? (isEN ? "note" : "nota") : isEN ? "notes" : "notas";

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div
        className="flex flex-col gap-6 rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-lg shadow-slate-900/5 backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/80 dark:shadow-black/30"
        style={{ width: containerWidth, minWidth: containerWidth, maxWidth: containerWidth, minHeight: containerMinHeight }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{isEN ? "Editorial calendar" : "Calendario editorial"}</p>
            <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{monthLabel}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-[#00BFFF] hover:text-[#00BFFF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00BFFF] active:scale-[0.99] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-[#33ceff] dark:hover:text-[#33ceff]"
              aria-label={isEN ? "Previous month" : "Mes anterior"}
            >
              ‹
            </button>
            <button
              onClick={handleNext}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-[#00BFFF] hover:text-[#00BFFF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00BFFF] active:scale-[0.99] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-[#33ceff] dark:hover:text-[#33ceff]"
              aria-label={isEN ? "Next month" : "Mes siguiente"}
            >
              ›
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section
            className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70 h-full"
            style={{ width: calendarWidth, minWidth: calendarWidth, maxWidth: calendarWidth }}
          >
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              {weekdayLabels.map((label, idx) => (
                <div key={`${label}-${idx}`}>{label}</div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-7 gap-2">
              {monthCells.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} className="h-12 rounded-xl bg-transparent" aria-hidden="true" />;

                const key = `${viewDate.getFullYear()}-${`${viewDate.getMonth() + 1}`.padStart(2, "0")}-${`${day}`.padStart(2, "0")}`;
                const isSelected = key === selectedDate;

                return (
                  <button
                    key={key}
                    onClick={() => handleSelectDay(day)}
                    className={`relative h-12 rounded-xl border text-sm font-semibold transition ${
                      isSelected
                        ? "border-[#00BFFF] bg-[#00BFFF]/10 text-[#006fa8] dark:border-[#33ceff] dark:bg-[#33ceff]/10 dark:text-[#8ad8ff]"
                        : "border-slate-200/80 bg-white text-slate-700 hover:-translate-y-[1px] hover:border-[#00BFFF] hover:text-[#00BFFF] dark:border-slate-800/80 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-[#33ceff] dark:hover:text-[#33ceff]"
                    }`}
                    aria-pressed={isSelected}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </section>

          <section
            className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70 h-full"
            style={{ width: "calc(100% + 24px)", maxWidth: "calc(100% + 24px)", marginRight: "-24px" }}
          >
            <header className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{publicationsLabel}</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{formattedSelectedDate}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                {selectedPosts.length} {notesLabel}
              </span>
            </header>

            {selectedPosts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300/80 bg-slate-50/70 p-4 text-sm text-slate-500 dark:border-slate-700/80 dark:bg-slate-800/60 dark:text-slate-300">
                {noPostsLabel}
              </div>
            ) : (
              <ul className="space-y-3">
                {selectedPosts.map((post) => (
                  <li key={post.slug} className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#00BFFF] dark:border-slate-700/80 dark:bg-slate-900">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{post.category}</p>
                    <p className="text-base font-semibold text-slate-800 dark:text-slate-50">{post.title}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{post.excerpt}</p>
                    <p className="mt-1 text-xs font-mono text-slate-500 dark:text-slate-400">{post.date}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
