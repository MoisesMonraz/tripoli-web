"use client";

import Link from "next/link";
import BaseBanner, { defaultSlides } from "../../../components/banners/BaseBanner";
import NewsCarousel from "../../../components/home/NewsCarousel";
import bannerSaludHero from "../../../Imagenes/Banners-Pagina-Web/Banner Sector Salud.png";

export default function SaludClient({ fabricantesData, institucionesData, especialistasData }) {
  const getLocalizedPosts = (posts) =>
    (posts || []).map((post, idx) => ({
      ...post,
      title: post.titleEs ?? post.title ?? `Titulo ${idx + 1}`,
      excerpt: post.excerptEs ?? post.excerpt ?? "Vista previa corta aqui...",
      date: post.dateEs ?? post.date ?? "Noviembre 2025",
    }));

  const labels = {
    bannerHeader: "Banner Header Sector Salud",
    fabricantes: "Fabricantes de equipos e insumos",
    cadenas: "Instituciones de Salud",
    conveniencia: "Especialistas Médicos",
    novedades: "Novedades",
    verMas: "Ver más noticias",
    bannerFabricantes: "Banner Fabricantes de equipos e insumos",
    bannerCadenas: "Banner Instituciones de Salud",
    bannerConveniencia: "Banner Especialistas Médicos",
  };

  const tailSlides = defaultSlides.slice(1);
  const heroSlides = [{ id: "salud-hero", src: bannerSaludHero, alt: "Sector Salud" }, ...tailSlides];
  const fabricantesSlides = [
    { id: "salud-fabricantes", src: "/images/banners/subcategorias/banner-fabricantes-equipos-insumos.png", alt: "Fabricantes de Equipos e Insumos" },
    ...tailSlides,
  ];
  const institucionesSlides = [
    { id: "salud-instituciones", src: "/images/banners/subcategorias/banner-instituciones-de-salud.png", alt: "Instituciones de Salud" },
    ...tailSlides,
  ];
  const especialistasSlides = [
    { id: "salud-especialistas", src: "/images/banners/subcategorias/banner-especialistas-medicos.png", alt: "Especialistas Médicos" },
    ...tailSlides,
  ];

  const SectionBlock = ({ title, posts, titleHref, moreHref, titleClassName = "text-lg lg:text-xl" }) => (
    <section className="flex flex-col gap-4 px-4 max-w-[70rem] mx-auto w-full sm:px-[12px] md:px-4">
      <div className="relative w-full">
        <div className="relative z-10 flex items-stretch gap-0">
          <span className="h-[44px] w-[8px] subcat-bar subcat-bar--left" aria-hidden="true" />
          {titleHref ? (
            <Link href={titleHref}>
              <h2 className={`inline-flex h-[44px] items-center px-3 ${titleClassName} font-semibold uppercase font-raleway tracking-[0.05em] transition-colors text-[#e6007e] bg-white dark:bg-transparent hover:text-[#8d004c] dark:hover:text-[#f9d3e6]`}>
                {title}
              </h2>
            </Link>
          ) : (
            <h2 className={`inline-flex h-[44px] items-center px-3 ${titleClassName} font-semibold uppercase font-raleway tracking-[0.05em] transition-colors text-[#e6007e] bg-white dark:bg-transparent hover:text-[#8d004c] dark:hover:text-[#f9d3e6]`}>
              {title}
            </h2>
          )}
          <div className="h-[44px] flex-1 subcat-bar subcat-bar--right" aria-hidden="true" />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-[10.5px] sm:text-[14px] font-bold uppercase tracking-[0.08em] text-slate-700 dark:text-slate-200">{labels.novedades}</p>
        <NewsCarousel posts={getLocalizedPosts(posts)} />
        <Link
          href={moreHref || titleHref || "#"}
          className="group relative text-right text-[10.5px] sm:text-[14px] font-bold uppercase tracking-[0.08em] text-slate-700 dark:text-slate-200 transition-colors duration-200 hover:text-[#00BFFF] dark:hover:text-[#33ceff] inline-block self-end"
        >
          <span className="relative inline-block">
            {labels.verMas}
            <span className="absolute left-0 right-0 bottom-0 h-px origin-left scale-x-0 transition-transform duration-200 ease-out bg-gradient-to-r from-[#00BFFF] to-[#33ceff] group-hover:scale-x-100 dark:from-[#33ceff] dark:to-[#66deff] will-change: transform" aria-hidden="true" />
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
        titleHref="/categoria/sector-salud/fabricantes-equipos-insumos"
        moreHref="/categoria/sector-salud/fabricantes-equipos-insumos"
        titleClassName="text-[12.5px] sm:text-lg lg:text-xl"
      />
      <section aria-label={labels.bannerFabricantes} className="m-0 p-0">
        <h2 className="sr-only">{labels.bannerFabricantes}</h2>
        <BaseBanner slides={fabricantesSlides} aspectRatioOverride={0.25} />
      </section>

      <SectionBlock
        title={labels.cadenas}
        posts={institucionesData}
        titleHref="/categoria/sector-salud/instituciones-de-salud"
        moreHref="/categoria/sector-salud/instituciones-de-salud"
      />
      <section aria-label={labels.bannerCadenas} className="m-0 p-0">
        <h2 className="sr-only">{labels.bannerCadenas}</h2>
        <BaseBanner slides={institucionesSlides} aspectRatioOverride={0.25} />
      </section>

      <SectionBlock
        title={labels.conveniencia}
        posts={especialistasData}
        titleHref="/categoria/sector-salud/especialistas-medicos"
        moreHref="/categoria/sector-salud/especialistas-medicos"
      />
      <section aria-label={labels.bannerConveniencia} className="m-0 p-0">
        <h2 className="sr-only">{labels.bannerConveniencia}</h2>
        <BaseBanner slides={especialistasSlides} aspectRatioOverride={0.25} />
      </section>

      <style>{`
        @property --subcat-grad-pos {
          syntax: "<percentage>";
          inherits: true;
          initial-value: 0%;
        }
        .subcat-bar {
          --subcat-grad-pos: 0%;
          background: linear-gradient(90deg, #e6007e, #f29fc5, #f9d3e6);
          background-size: 300% 100%;
          background-position: var(--subcat-grad-pos, 0%) 0;
        }
        .subcat-bar--left {
          background: #e6007e;
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
          0% { background-color: #e6007e; }
          50% { background-color: #f9d3e6; }
          100% { background-color: #e6007e; }
        }
      `}</style>
    </main>
  );
}
