"use client";

import Link from "next/link";
import { useRef } from "react";
import BaseBanner, { defaultSlides } from "../../../components/banners/BaseBanner";
import NewsCarousel from "../../../components/home/NewsCarousel";
import { useLanguage } from "../../../components/LanguageProvider";
import { useFitText } from "../../../components/ui/useFitText";
import bannerEntretenimientoHero from "../../../Imagenes/Banners-Pagina-Web/Banner Entretenimiento y Cultura.png";
import bannerProductoras from "../../../Imagenes/Banners-Pagina-Web/Subcategorias/Banner-Productoras-de-Contenido.png";
import bannerRecintos from "../../../Imagenes/Banners-Pagina-Web/Subcategorias/Banner-Recintos-Culturales.png";
import bannerFestivales from "../../../Imagenes/Banners-Pagina-Web/Subcategorias/Banner-Festivales-Eventos-y-Artistas.png";

export default function EntretenimientoClient({ productorasData, recintosData, festivalesData }) {
  const { language } = useLanguage();
  const isEnglish = language === "EN";

  const getLocalizedPosts = (posts) =>
    (posts || []).map((post, idx) =>
      isEnglish
        ? post
        : {
            ...post,
            title: post.titleEs ?? post.title ?? `Título ${idx + 1}`,
            excerpt: post.excerptEs ?? post.excerpt ?? "Vista previa corta aquí...",
            date: post.dateEs ?? post.date ?? "Noviembre 2025",
          }
    );

  const labels = {
    bannerHeader: isEnglish ? "Banner Header Entertainment & Culture" : "Banner Header Entretenimiento y Cultura",
    fabricantes: isEnglish ? "Content Producers" : "Productoras de Contenido",
    cadenas: isEnglish ? "Cultural Venues" : "Recintos Culturales",
    conveniencia: isEnglish ? "Festivals, Events & Artists" : "Festivales, Eventos y Artistas",
    novedades: isEnglish ? "Latest news" : "Novedades",
    verMas: isEnglish ? "See more news" : "Ver más noticias",
    bannerFabricantes: isEnglish ? "Banner Content Producers" : "Banner Productoras de Contenido",
    bannerCadenas: isEnglish ? "Banner Cultural Venues" : "Banner Recintos Culturales",
    bannerConveniencia: isEnglish ? "Banner Festivals, Events & Artists" : "Banner Festivales, Eventos y Artistas",
  };

  const barVars = {
    "--bar-base": "#009640",
    "--bar-mid": "#cce5ce",
    "--bar-light": "#cce5ce",
  };

  const tailSlides = defaultSlides.slice(1);
  const heroSlides = [{ id: "entretenimiento-hero", src: bannerEntretenimientoHero, alt: "Entretenimiento y Cultura" }, ...tailSlides];
  const productorasSlides = [
    { id: "entretenimiento-productoras", src: bannerProductoras, alt: "Productoras de Contenido" },
    ...tailSlides,
  ];
  const recintosSlides = [{ id: "entretenimiento-recintos", src: bannerRecintos, alt: "Recintos Culturales" }, ...tailSlides];
  const festivalesSlides = [
    { id: "entretenimiento-festivales", src: bannerFestivales, alt: "Festivales, Eventos y Artistas" },
    ...tailSlides,
  ];

  const SectionBlock = ({ title, posts, titleHref, moreHref }) => {
    const titleRef = useRef(null);
    useFitText(titleRef, [title]);
    const linkHref = moreHref || titleHref || "#";

    return (
      <section className="flex flex-col gap-4 px-4 max-w-[70rem] mx-auto w-full sm:px-[12px] md:px-4">
        <div className="relative w-full">
          <div className="relative z-10 flex items-stretch gap-0">
            <span className="h-[44px] w-[8px] subcat-bar subcat-bar--left" style={barVars} aria-hidden="true" />
            {titleHref ? (
              <Link href={titleHref}>
                <h2
                  ref={titleRef}
                  className="
                    flex h-[44px] items-center px-3
                    text-lg lg:text-xl font-semibold uppercase font-raleway
                    w-full max-w-[65%] sm:max-w-none whitespace-nowrap overflow-hidden
                    tracking-[0.05em] transition-colors
                    text-[#009640]
                    bg-white dark:bg-transparent
                    hover:text-[#005f27] dark:hover:text-[#cce5ce]
                  "
                >
                  {title}
                </h2>
              </Link>
            ) : (
              <h2
                ref={titleRef}
                className="
                  flex h-[44px] items-center px-3
                  text-lg lg:text-xl font-semibold uppercase font-raleway
                  w-full max-w-[65%] sm:max-w-none whitespace-nowrap overflow-hidden
                  tracking-[0.05em] transition-colors
                  text-[#009640]
                  bg-white dark:bg-transparent
                  hover:text-[#005f27] dark:hover:text-[#cce5ce]
                "
              >
                {title}
              </h2>
            )}
            <div className="h-[44px] flex-1 subcat-bar subcat-bar--right" style={barVars} aria-hidden="true" />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-[14px] font-bold uppercase tracking-[0.08em] text-slate-700 dark:text-slate-200">
            {labels.novedades}
          </p>
          <NewsCarousel posts={getLocalizedPosts(posts)} />
          <Link
            href={linkHref}
            className="
              group relative text-right text-[14px] font-bold uppercase tracking-[0.08em]
              text-slate-700 dark:text-slate-200
              transition-colors duration-200
              hover:text-[#00BFFF] dark:hover:text-[#33ceff]
              inline-block self-end
            "
          >
            <span className="relative inline-block">
              {labels.verMas}
              <span
                className="
                  absolute left-0 right-0 bottom-0 h-px
                  origin-left scale-x-0 transition-transform duration-200 ease-out
                  bg-gradient-to-r from-[#00BFFF] to-[#33ceff]
                  group-hover:scale-x-100
                  dark:from-[#33ceff] dark:to-[#66deff]
                  will-change: transform
                "
                aria-hidden="true"
              />
            </span>
          </Link>
        </div>
      </section>
    );
  };

  return (
    <main className="flex flex-col gap-4 pb-12">
      <h1 className="sr-only">{labels.bannerHeader}</h1>
      <section aria-label={labels.bannerHeader}>
        <BaseBanner slides={heroSlides} />
      </section>

      <SectionBlock title={labels.fabricantes} posts={productorasData} titleHref="/categoria/entretenimiento-y-cultura/productoras-de-contenido" moreHref="/categoria/entretenimiento-y-cultura/productoras-de-contenido" />
      <section aria-label={labels.bannerFabricantes} className="m-0 p-0">
        <h2 className="sr-only">{labels.bannerFabricantes}</h2>
        <BaseBanner slides={productorasSlides} />
      </section>

      <SectionBlock title={labels.cadenas} posts={recintosData} titleHref="/categoria/entretenimiento-y-cultura/recintos-culturales" moreHref="/categoria/entretenimiento-y-cultura/recintos-culturales" />
      <section aria-label={labels.bannerCadenas} className="m-0 p-0">
        <h2 className="sr-only">{labels.bannerCadenas}</h2>
        <BaseBanner slides={recintosSlides} />
      </section>

      <SectionBlock title={labels.conveniencia} posts={festivalesData} titleHref="/categoria/entretenimiento-y-cultura/festivales-eventos-artistas" moreHref="/categoria/entretenimiento-y-cultura/festivales-eventos-artistas" />
      <section aria-label={labels.bannerConveniencia} className="m-0 p-0">
        <h2 className="sr-only">{labels.bannerConveniencia}</h2>
        <BaseBanner slides={festivalesSlides} />
      </section>

      <style>{`
        @property --subcat-grad-pos {
          syntax: "<percentage>";
          inherits: true;
          initial-value: 0%;
        }
        .subcat-bar {
          --subcat-grad-pos: 0%;
          background: linear-gradient(
            90deg,
            var(--bar-base, #009640),
            var(--bar-mid, #cce5ce),
            var(--bar-light, #cce5ce)
          );
          background-size: 300% 100%;
          background-position: var(--subcat-grad-pos, 0%) 0;
        }
        .subcat-bar--left {
          background: var(--bar-base, #009640);
          background-image: none;
          animation: subcatPulse 12s linear infinite;
        }
        .subcat-bar--right {
          animation: subcatGradMove 12s ease-in-out infinite;
        }
        @keyframes subcatGradMove {
          0% { --subcat-grad-pos: 0%; }
          50% { --subcat-grad-pos: 100%; }
          100% { --subcat-grad-pos: 0%; }
        }
        @keyframes subcatPulse {
          0% { background-color: var(--bar-base, #009640); }
          50% { background-color: var(--bar-light, #cce5ce); }
          100% { background-color: var(--bar-base, #009640); }
        }
      `}</style>
    </main>
  );
}
