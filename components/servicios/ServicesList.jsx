"use client";

import { useState } from "react";
import { servicesData } from "./servicesData";
import AnimatedServiceBorderBox from "../ui/AnimatedServiceBorderBox";
import { useLanguage } from "../LanguageProvider";

export default function ServicesList() {
  const [openIds, setOpenIds] = useState([]);
  const { language } = useLanguage();

  return (
    <section className="max-w-[70rem] mx-auto w-full px-4 sm:px-6 md:px-4">
      <div className="flex flex-col gap-3 sm:gap-4">
        {servicesData.map((service) => {
          const isOpen = openIds.includes(service.id);
          const title = service.title[language] ?? service.title.ES;
          const tagline = service.tagline[language] ?? service.tagline.ES;
          const tone = service.tone?.[language] ?? service.tone?.ES;
          const bullets = service.bullets[language] ?? service.bullets.ES;
          const introLabel = service.introLabel?.[language] ?? (language === "EN" ? "Expanded Content" : "Contenido detallado");
          const description = service.description?.[language] ?? service.description?.ES;
          const closing = service.closing?.[language] ?? service.closing?.ES;

          return (
            <AnimatedServiceBorderBox
              as="article"
              key={service.id}
              className="border border-transparent bg-white/90 shadow-sm shadow-slate-900/5 transition hover:shadow-md hover:shadow-slate-900/10 dark:bg-slate-900/80 dark:shadow-black/20"
            >
              <button
                type="button"
                onClick={() =>
                  setOpenIds((prev) => {
                    if (prev.includes(service.id)) {
                      return prev.filter((id) => id !== service.id);
                    }
                    const next = [...prev, service.id];
                    if (next.length <= 2) return next;
                    return next.slice(next.length - 2);
                  })
                }
                className="w-full flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-4 md:px-5 py-3 sm:py-4 text-left"
                aria-expanded={isOpen}
              >
                <div className="flex flex-col gap-1">
                  <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-slate-800 dark:text-slate-50">{title}</h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-3xl text-justify">{tagline}</p>
                  {description ? <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-3xl text-justify">{description}</p> : null}
                </div>
                <span
                  className={`flex h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 ${isOpen ? "rotate-45" : ""
                    }`}
                  aria-hidden="true"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.75v14.5M4.75 12h14.5" />
                  </svg>
                </span>
              </button>

              {isOpen && (
                <div className="px-3 sm:px-4 md:px-5 pb-4 sm:pb-5">
                  <div className="flex flex-col gap-2 sm:gap-3 border-t border-slate-200/80 pt-3 sm:pt-4 dark:border-slate-800">
                    <p className="text-[10px] sm:text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{introLabel}</p>
                    <ul className="flex flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                      {bullets.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-[6px] h-[5px] w-[5px] sm:h-[6px] sm:w-[6px] rounded-full bg-sky-500 flex-shrink-0" aria-hidden="true" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    {closing ? <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed text-justify">{closing}</p> : null}
                  </div>
                </div>
              )}
            </AnimatedServiceBorderBox>
          );
        })}
      </div>
    </section>
  );
}
