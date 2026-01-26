"use client";

import { useLanguage } from "../LanguageProvider";

export default function ServicesIntro() {
  const { language } = useLanguage();

  const headline = "TRIPOLI MEDIA SERVICES";

  const description =
    language === "EN"
      ? "Discover our suite of editorial, analytics, and web solutions focused on solving visibility and digital performance challenges to achieve strategic, measurable positioning grounded in data."
      : "Conoce nuestra oferta de soluciones editoriales, analíticas y web, enfocadas en resolver retos de visibilidad y desempeño digital para lograr un posicionamiento estratégico y medible basado en datos.";

  const label = language === "EN" ? "Services" : "Servicios";

  return (
    <section className="max-w-[70rem] mx-auto w-full px-4 sm:px-[12px] md:px-4">
      <div className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">{label}</p>
        <h1 className="text-2xl lg:text-[28px] font-semibold services-title inline-block">{headline}</h1>
        <p className="text-[15px] leading-relaxed text-slate-600 dark:text-slate-300 max-w-3xl">{description}</p>
      </div>
      <style jsx>{`
        @keyframes servicesTitleSweep {
          0% {
            background-position: 0% 0;
          }
          50% {
            background-position: 100% 0;
          }
          100% {
            background-position: 0% 0;
          }
        }

        .services-title {
          background: linear-gradient(90deg, #0082b9, #00b6ed, #0082b9);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: servicesTitleSweep 10s ease-in-out infinite;
          color: #0082b9;
        }

        :global(.dark) .services-title {
          background: linear-gradient(90deg, #1c90d4, #5aceff, #1c90d4);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
        }
      `}</style>
    </section>
  );
}
