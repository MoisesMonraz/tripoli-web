"use client";

import Image from "next/image";
import Link from "next/link";

export default function NewsCardHorizontal({ title, excerpt, image, date, slug }) {
  return (
    <article className="flex h-[250px] w-[500px] flex-row items-center gap-4 rounded-xl border border-slate-200/60 bg-white/80 p-5 shadow-md shadow-slate-900/5 transition hover:border-[#00BFFF]/60 hover:shadow-lg hover:shadow-slate-900/10 dark:border-slate-800/70 dark:bg-slate-900/70 dark:hover:border-[#33ceff]/60">
      <div className="relative h-[200px] w-[200px] flex-shrink-0 overflow-hidden bg-slate-200 dark:bg-slate-800">
        <Image src={image} alt={title} fill className="object-cover" sizes="220px" />
      </div>
      <div className="flex flex-1 flex-col justify-center gap-2 overflow-hidden">
        <Link
          href={`/noticia/${slug}`}
          className="text-lg font-semibold leading-snug text-slate-900 transition hover:text-[#00BFFF] dark:text-slate-50 dark:hover:text-[#33ceff] line-clamp-1"
        >
          {title}
        </Link>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-snug line-clamp-3">{excerpt}</p>
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">{date}</span>
      </div>
    </article>
  );
}
