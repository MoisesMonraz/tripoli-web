"use client";

import Link from "next/link";
import { useRef } from "react";
import BaseBanner, { defaultSlides } from "../../../components/banners/BaseBanner";
import NewsCarousel from "../../../components/home/NewsCarousel";
import { useLanguage } from "../../../components/LanguageProvider";
import { useFitText } from "../../../components/ui/useFitText";
import bannerConsumoHero from "../../../Imagenes/Banners-Pagina-Web/Banner Consumo y Retail.png";
import bannerFabricantes from "../../../Imagenes/Banners-Pagina-Web/Subcategorias/Banner-Fabricantes-y-Proveedores.png";
import bannerCadenas from "../../../Imagenes/Banners-Pagina-Web/Subcategorias/Banner-Cadenas-Comerciales.png";
import bannerConveniencia from "../../../Imagenes/Banners-Pagina-Web/Subcategorias/Banner-Tiendas-de-Conveniencia.png";

export default function ConsumoRetailClient({ fabricantesData, cadenasData, convenienciaData }) {
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
    bannerHeader: isEnglish ? "Banner Header Consumer & Retail" : "Banner Header Consumo y Retail",
    fabricantes: isEnglish ? "Manufacturers & Suppliers" : "Fabricantes y Proveedores",
    cadenas: isEnglish ? "Retail Chains" : "Cadenas Comerciales",
    conveniencia: isEnglish ? "Convenience Stores" : "Tiendas de Conveniencia",
    novedades: isEnglish ? "Latest news" : "Novedades",
    verMas: isEnglish ? "See more news" : "Ver más noticias",
    bannerFabricantes: isEnglish ? "Banner Manufacturers & Suppliers" : "Banner Fabricantes y Proveedores",
    bannerCadenas: isEnglish ? "Banner Retail Chains" : "Banner Cadenas Comerciales",
    bannerConveniencia: isEnglish ? "Banner Convenience Stores" : "Banner Tiendas de Conveniencia",
  };

  const tailSlides = defaultSlides.slice(1);
  const heroSlides = [{ id: "consumo-hero", src: bannerConsumoHero, alt: "Consumo y Retail" }, ...tailSlides];
  const fabricantesSlides = [
    { id: "consumo-fabricantes", src: bannerFabricantes, alt: "Fabricantes y Proveedores" },
    ...tailSlides,
  ];
  const cadenasSlides = [{ id: "consumo-cadenas", src: bannerCadenas, alt: "Cadenas Comerciales" }, ...tailSlides];
  const convenienciaSlides = [
    { id: "consumo-conveniencia", src: bannerConveniencia, alt: "Tiendas de Conveniencia" },
    ...tailSlides,
  ];

  const SectionBlock = ({ title, posts, titleHref, moreHref }) => {
    const titleRef = useRef(null);
    useFitText(titleRef, [title]);

    return (
      <section className="flex flex-col gap-4 px-4 max-w-[70rem] mx-auto w-full sm:px-[12px] md:px-4">
        <div className="relative w-full">
          <div className="relative z-10 flex items-stretch gap-0">
            <span className="h-[44px] w-[8px] subcat-bar subcat-bar--left" aria-hidden="true" />
            {titleHref ? (
              <Link href={titleHref}>
                  <h2
                    ref={titleRef}
                    className="
                      flex h-[44px] items-center px-3
                      text-lg lg:text-xl font-semibold uppercase font-raleway
                      w-full max-w-[65%] sm:max-w-none whitespace-nowrap overflow-hidden
                      tracking-[0.05em] transition-colors
                      text-[#f39200]
                      bg-white dark:bg-transparent
                      hover:text-[#935b00] dark:hover:text-[#cce5ce]
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
                  text-[#f39200]
                  bg-white dark:bg-transparent
                  hover:text-[#935b00] dark:hover:text-[#cce5ce]
                "
              >
                {title}
              </h2>
            )}
            <div className="h-[44px] flex-1 subcat-bar subcat-bar--right" aria-hidden="true" />
          </div>
        </div>

      <div className="flex flex-col gap-1">
        <p className="text-[14px] font-bold uppercase tracking-[0.08em] text-slate-700 dark:text-slate-200">
          {labels.novedades}
        </p>
        <NewsCarousel posts={getLocalizedPosts(posts)} />
        {moreHref ? (
          <Link href={moreHref}>
            <p
              className="
                group relative text-right text-[14px] font-bold uppercase tracking-[0.08em]
                text-slate-700 dark:text-slate-200
                transition-colors duration-200
                hover:text-[#00BFFF] dark:hover:text-[#33ceff]
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
            </p>
          </Link>
        ) : (
          <p
            className="
              group relative text-right text-[14px] font-bold uppercase tracking-[0.08em]
              text-slate-700 dark:text-slate-200
              transition-colors duration-200
              hover:text-[#00BFFF] dark:hover:text-[#33ceff]
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
          </p>
        )}
      </div>
      </section>
    );
  };

  return (
    <main className="flex flex-col gap-4 pb-12">
      <h1 className="sr-only">{labels.bannerHeader}</h1>
      <section aria-label={labels.bannerHeader}>
        <BaseBanner slides={heroSlides} aspectRatioOverride={0.25} />
      </section>

      <SectionBlock
        title={labels.fabricantes}
        posts={fabricantesData}
        titleHref="/categoria/consumo-y-retail/fabricantes-y-proveedores"
        moreHref="/categoria/consumo-y-retail/fabricantes-y-proveedores"
      />
      <section aria-label={labels.bannerFabricantes} className="m-0 p-0">
        <h2 className="sr-only">{labels.bannerFabricantes}</h2>
        <BaseBanner slides={fabricantesSlides} aspectRatioOverride={0.25} />
      </section>

      <SectionBlock
        title={labels.cadenas}
        posts={cadenasData}
        titleHref="/categoria/consumo-y-retail/cadenas-comerciales"
        moreHref="/categoria/consumo-y-retail/cadenas-comerciales"
      />
      <section aria-label={labels.bannerCadenas} className="m-0 p-0">
        <h2 className="sr-only">{labels.bannerCadenas}</h2>
        <BaseBanner slides={cadenasSlides} aspectRatioOverride={0.25} />
      </section>

      <SectionBlock
        title={labels.conveniencia}
        posts={convenienciaData}
        titleHref="/categoria/consumo-y-retail/tiendas-de-conveniencia"
        moreHref="/categoria/consumo-y-retail/tiendas-de-conveniencia"
      />
      <section aria-label={labels.bannerConveniencia} className="m-0 p-0">
        <h2 className="sr-only">{labels.bannerConveniencia}</h2>
        <BaseBanner slides={convenienciaSlides} aspectRatioOverride={0.25} />
      </section>

      <style>{`
        @property --subcat-grad-pos {
          syntax: "<percentage>";
          inherits: true;
          initial-value: 0%;
        }
        .subcat-bar {
          --subcat-grad-pos: 0%;
          background: linear-gradient(90deg, #f39200, #fdc652, #fee5c8);
          background-size: 300% 100%;
          background-position: var(--subcat-grad-pos, 0%) 0;
        }
        .subcat-bar--left {
          background: #f39200;
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
          0% { background-color: #f39200; }
          50% { background-color: #fee5c8; }
          100% { background-color: #f39200; }
        }
      `}</style>
    </main>
  );
}
