"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useFavorites } from "../../components/favorites/FavoritesContext";

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

const UI_TEXT = {
    label: "Favoritos",
    title: "Artículos guardados como favoritos",
    emptyTitle: "No tienes artículos guardados",
    emptyDescription: "Cuando encuentres un artículo que te interese, haz clic en la estrella para guardarlo aquí.",
    exploreButton: "Explorar artículos",
    author: "por: Tripoli Publishing House",
    removeLabel: "Quitar de favoritos",
};

export default function FavoritosClient() {
    const { favorites, removeFavorite, isLoaded } = useFavorites();
    const t = UI_TEXT;

    const formatDate = formatFullSpanishDate;

    if (!isLoaded) {
        return (
            <main className="flex flex-col gap-8 sm:gap-10 pb-12 sm:pb-16 pt-8 sm:pt-12 font-raleway bg-white dark:bg-slate-950">
                <section className="max-w-[70rem] mx-auto w-full px-5 sm:px-7 md:px-5">
                    <div className="flex flex-col gap-2 sm:gap-3">
                        <p className="text-[10px] sm:text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">{t.label}</p>
                        <h1 className="text-xl sm:text-2xl lg:text-[28px] font-semibold uppercase bg-gradient-to-r from-[#0082b9] via-[#00b6ed] to-[#0082b9] bg-[length:200%_100%] bg-clip-text text-transparent animate-servicesTitleSweep">
                            {t.title}
                        </h1>
                    </div>
                    <div className="mt-8 flex items-center justify-center py-16">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-[#00BFFF]" />
                    </div>
                </section>
            </main>
        );
    }

    return (
        <main className="flex flex-col gap-8 sm:gap-10 pb-12 sm:pb-16 pt-8 sm:pt-12 font-raleway bg-white dark:bg-slate-950">
            <section className="max-w-[70rem] mx-auto w-full px-5 sm:px-7 md:px-5">
                {/* Page Header - matching static pages style */}
                <div className="flex flex-col gap-2 sm:gap-3 mb-8 md:mb-12">
                    <p className="text-[10px] sm:text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">{t.label}</p>
                    <h1 className="text-xl sm:text-2xl lg:text-[28px] font-semibold uppercase bg-gradient-to-r from-[#0082b9] via-[#00b6ed] to-[#0082b9] bg-[length:200%_100%] bg-clip-text text-transparent animate-servicesTitleSweep">
                        {t.title}
                    </h1>
                </div>

                {/* Favorites Grid or Empty State */}
                {favorites.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <svg
                            className="mb-4 h-16 w-16 text-slate-300 dark:text-slate-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                            />
                        </svg>
                        <h2 className="font-sans text-lg font-semibold text-slate-700 dark:text-slate-300">
                            {t.emptyTitle}
                        </h2>
                        <p className="mt-2 max-w-md font-serif text-sm text-slate-500 dark:text-slate-400">
                            {t.emptyDescription}
                        </p>
                        <Link
                            href="/"
                            className="mt-6 rounded-lg bg-[#00BFFF] px-6 py-2.5 font-sans text-sm font-semibold text-white transition-colors hover:bg-[#0099CC]"
                        >
                            {t.exploreButton}
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {favorites.map((article) => {
                            const articleHref = article.category && article.subcategory
                                ? `/${article.category}/${article.subcategory}/articulo/${article.slug}`
                                : `/articulo/${article.slug}`;
                            const formattedDate = formatDate(article.date);
                            const displayTitle = article.title;

                            return (
                                <article
                                    key={article.slug}
                                    className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200/60 bg-white/80 shadow-md shadow-slate-900/5 transition hover:border-[#00BFFF]/60 hover:shadow-lg dark:border-slate-800/70 dark:bg-slate-900/70 dark:hover:border-[#33ceff]/60"
                                >
                                    {/* Image */}
                                    <Link href={articleHref} className="relative aspect-[16/9] overflow-hidden">
                                        <Image
                                            src={article.image}
                                            alt={article.title}
                                            fill
                                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        />
                                    </Link>

                                    {/* Content */}
                                    <div className="flex flex-1 flex-col p-4">
                                        <Link
                                            href={articleHref}
                                            className="font-sans text-sm font-semibold leading-snug text-slate-900 transition-colors hover:text-[#00BFFF] dark:text-slate-50 dark:hover:text-[#33ceff] line-clamp-2"
                                        >
                                            {displayTitle}
                                        </Link>
                                        {article.excerpt && (
                                            <p className="mt-2 font-serif text-xs leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-2">
                                                {article.excerpt}
                                            </p>
                                        )}
                                        <div className="mt-auto pt-3 flex items-center gap-2 text-[10px] font-sans">
                                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                                                por: {article.slug === "la-reforma-de-las-40-horas-justicia-social-y-el-reto-de-la-supervivencia-pyme" ? "Emiliano Méndez Alonso" : "Tripoli Publishing House"}
                                            </span>
                                            <span className="text-slate-300 dark:text-slate-600">|</span>
                                            <time className="text-slate-500 dark:text-slate-400">
                                                {formattedDate}
                                            </time>
                                        </div>
                                    </div>

                                    {/* Remove Button */}
                                    <button
                                        onClick={() => removeFavorite(article.slug)}
                                        className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 shadow-md transition-all hover:bg-red-50 hover:scale-110 dark:bg-slate-800/90 dark:hover:bg-red-900/50"
                                        aria-label={t.removeLabel}
                                        title={t.removeLabel}
                                    >
                                        <svg
                                            className="h-4 w-4 text-[#00BFFF]"
                                            fill="#00BFFF"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                        </svg>
                                    </button>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Animation styles matching static pages */}
            <style jsx>{`
                @keyframes servicesTitleSweep {
                    0% { background-position: 0% 0; }
                    50% { background-position: 100% 0; }
                    100% { background-position: 0% 0; }
                }
                .animate-servicesTitleSweep {
                    animation: servicesTitleSweep 10s ease-in-out infinite;
                }
            `}</style>
        </main>
    );
}
