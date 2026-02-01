"use client";

import Link from "next/link";
import BaseBanner, { defaultSlides } from "../../../components/banners/BaseBanner";
import NewsCarousel from "../../../components/home/NewsCarousel";
import { useLanguage } from "../../../components/LanguageProvider";
import bannerIndustriaHero from "../../../Imagenes/Banners-Pagina-Web/Banner Industria T.I..png";

export default function IndustriaTIClient({ fabricantesData, mayoristasData, canalesData }) {
  const { language } = useLanguage();
  const isEnglish = language === "EN";

  const getLocalizedPosts = (posts) =>
    (posts || []).map((post, idx) =>
      isEnglish
        ? post
        : {
            ...post,
            title: post.titleEs ?? post.title ?? `Titulo ${idx + 1}`,
            excerpt: post.excerptEs ?? post.excerpt ?? "Vista previa corta aqui...",
            date: post.dateEs ?? post.date ?? "Noviembre 2025",
          }
    );

  const labels = {
    bannerHeader: isEnglish ? "Banner Header IT Industry" : "Banner Header Industria TI",
    fabricantes: isEnglish ? "Technology Manufacturers" : "Fabricantes de Tecnología",
    cadenas: isEnglish ? "IT Wholesalers" : "Mayoristas TI",
    conveniencia: isEnglish ? "Distribution Channels" : "Canales de Distribución",
    novedades: isEnglish ? "Latest news" : "Novedades",
    verMas: isEnglish ? "See more news" : "Ver más noticias",
    bannerFabricantes: isEnglish ? "Banner Technology Manufacturers" : "Banner Fabricantes de Tecnología",
    bannerCadenas: isEnglish ? "Banner IT Wholesalers" : "Banner Mayoristas TI",
    bannerConveniencia: isEnglish ? "Banner Distribution Channels" : "Banner Canales de Distribución",
  };

  const barVars = {
    "--bar-base": "#0069b4",
    "--bar-mid": "#c8d5ef",
    "--bar-light": "#c8d5ef",
  };

  const tailSlides = defaultSlides.slice(1);
  const heroSlides = [{ id: "industria-hero", src: bannerIndustriaHero, alt: "Industria TI" }, ...tailSlides];
  const fabricantesSlides = [
    { id: "industria-fabricantes", src: "/images/banners/subcategorias/banner-fabricantes-de-tecnologia.png", alt: "Fabricantes de Tecnologia" },
    ...tailSlides,
  ];
  const mayoristasSlides = [
    { id: "industria-mayoristas", src: "/images/banners/subcategorias/banner-mayoristas-ti.png", alt: "Mayoristas TI" },
    ...tailSlides,
  ];
  const canalesSlides = [
    { id: "industria-canales", src: "/images/banners/subcategorias/banner-canales-de-distribucion.png", alt: "Canales de Distribución" },
    ...tailSlides,
  ];

  const SectionBlock = ({ title, posts, titleHref, moreHref }) => (
    <section className="flex flex-col gap-4 px-4 max-w-[70rem] mx-auto w-full sm:px-[12px] md:px-4">
      <div className="relative w-full">
        <div className="relative z-10 flex items-stretch gap-0">
          <span className="h-[44px] w-[8px] subcat-bar subcat-bar--left" style={barVars} aria-hidden="true" />
          {titleHref ? (
            <Link href={titleHref}>
              <h2 className="inline-flex h-[44px] items-center px-3 text-lg lg:text-xl font-semibold uppercase font-raleway tracking-[0.05em] transition-colors text-[#0069b4] bg-white dark:bg-transparent hover:text-[#004070] dark:hover:text-[#c8d5ef]">
                {title}
              </h2>
            </Link>
          ) : (
            <h2 className="inline-flex h-[44px] items-center px-3 text-lg lg:text-xl font-semibold uppercase font-raleway tracking-[0.05em] transition-colors text-[#0069b4] bg-white dark:bg-transparent hover:text-[#004070] dark:hover:text-[#c8d5ef]">
              {title}
            </h2>
          )}
          <div className="h-[44px] flex-1 subcat-bar subcat-bar--right" style={barVars} aria-hidden="true" />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-[10.5px] sm:text-[14px] font-bold uppercase tracking-[0.08em] text-slate-700">{labels.novedades}</p>
        <NewsCarousel posts={getLocalizedPosts(posts)} />
        <Link
          href={moreHref || titleHref || "#"}
          className="group relative text-right text-[10.5px] sm:text-[14px] font-bold uppercase tracking-[0.08em] text-slate-700 transition-colors duration-200 hover:text-[#00BFFF] inline-block self-end"
        >
          <span className="relative inline-block">
            {labels.verMas}
            <span className="absolute left-0 right-0 bottom-0 h-px origin-left scale-x-0 transition-transform duration-200 ease-out bg-gradient-to-r from-[#00BFFF] to-[#33ceff] group-hover:scale-x-100 will-change: transform" aria-hidden="true" />
          </span>
        </Link>
      </div>
    </section>
  );

  return (
    <main className="flex flex-col gap-4 pb-12">
      <h1 className="sr-only">{labels.bannerHeader}</h1>
      <section aria-label={labels.bannerHeader}>
        <BaseBanner slides={heroSlides} aspectRatioOverride={0.25} />
      </section>

      <SectionBlock
        title={labels.fabricantes}
        posts={fabricantesData}
        titleHref="/categoria/industria-ti/fabricantes-de-tecnologia"
        moreHref="/categoria/industria-ti/fabricantes-de-tecnologia"
      />
      <section aria-label={labels.bannerFabricantes} className="m-0 p-0">
        <h2 className="sr-only">{labels.bannerFabricantes}</h2>
        <BaseBanner slides={fabricantesSlides} aspectRatioOverride={0.25} />
      </section>

      <SectionBlock
        title={labels.cadenas}
        posts={mayoristasData}
        titleHref="/categoria/industria-ti/mayoristas-ti"
        moreHref="/categoria/industria-ti/mayoristas-ti"
      />
      <section aria-label={labels.bannerCadenas} className="m-0 p-0">
        <h2 className="sr-only">{labels.bannerCadenas}</h2>
        <BaseBanner slides={mayoristasSlides} aspectRatioOverride={0.25} />
      </section>

      <SectionBlock
        title={labels.conveniencia}
        posts={canalesData}
        titleHref="/categoria/industria-ti/canales-de-distribucion"
        moreHref="/categoria/industria-ti/canales-de-distribucion"
      />
      <section aria-label={labels.bannerConveniencia} className="m-0 p-0">
        <h2 className="sr-only">{labels.bannerConveniencia}</h2>
        <BaseBanner slides={canalesSlides} aspectRatioOverride={0.25} />
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
            var(--bar-base, #0069b4),
            var(--bar-mid, #c8d5ef),
            var(--bar-light, #c8d5ef)
          );
          background-size: 300% 100%;
          background-position: var(--subcat-grad-pos, 0%) 0;
        }
        .subcat-bar--left {
          background: var(--bar-base, #0069b4);
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
          0% { background-color: var(--bar-base, #0069b4); }
          50% { background-color: var(--bar-light, #c8d5ef); }
          100% { background-color: var(--bar-base, #0069b4); }
        }
      `}</style>
    </main>
  );
}
