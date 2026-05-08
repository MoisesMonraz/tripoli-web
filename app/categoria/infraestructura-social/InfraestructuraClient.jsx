"use client";

import Link from "next/link";
import BaseBanner, { defaultSlides } from "../../../components/banners/BaseBanner";
import NewsCarousel from "../../../components/home/NewsCarousel";
import bannerInfraHero from "../../../Imagenes/Banners-Pagina-Web/Banner Infraestructura Social.png";

export default function InfraestructuraClient({ proveedoresData, desarrolladoresData, promotoresData }) {
  const getLocalizedPosts = (posts) =>
    (posts || []).map((post, idx) => ({
      ...post,
      title: post.titleEs ?? post.title ?? `Título ${idx + 1}`,
      excerpt: post.excerptEs ?? post.excerpt ?? "Vista previa corta aquí...",
      date: post.dateEs ?? post.date ?? "Noviembre 2025",
    }));

  const labels = {
    bannerHeader: "Banner Header Infraestructura Social",
    proveedores: "Proveedores de Materiales",
    desarrolladores: "Desarrolladores de Proyectos",
    promotores: "Promotores Inmobiliarios",
    novedades: "Novedades",
    verMas: "Ver más noticias",
    bannerProveedores: "Banner Proveedores de Materiales",
    bannerDesarrolladores: "Banner Desarrolladores de Proyectos",
    bannerPromotores: "Banner Promotores Inmobiliarios",
  };

  const tailSlides = defaultSlides.slice(1);
  const heroSlides = [{ id: "infra-hero", src: bannerInfraHero, alt: "Infraestructura Social" }, ...tailSlides];
  const proveedoresSlides = [
    { id: "infra-proveedores", src: "/images/banners/subcategorias/banner-proveedores-de-materiales.png", alt: "Proveedores de Materiales" },
    ...tailSlides,
  ];
  const desarrolladoresSlides = [
    { id: "infra-desarrolladores", src: "/images/banners/subcategorias/banner-desarrolladores-de-proyectos.png", alt: "Desarrolladores de Proyectos" },
    ...tailSlides,
  ];
  const promotoresSlides = [
    { id: "infra-promotores", src: "/images/banners/subcategorias/banner-promotores-inmobiliarios.png", alt: "Promotores Inmobiliarios" },
    ...tailSlides,
  ];

  const SectionBlock = ({ title, posts, titleHref, moreHref, titleClassName = "text-lg lg:text-xl" }) => (
    <section className="flex flex-col gap-4 px-4 max-w-[70rem] mx-auto w-full sm:px-[12px] md:px-4">
      <div className="relative w-full">
        <div className="relative z-10 flex items-stretch gap-0">
          <span className="h-[44px] w-[8px] subcat-bar subcat-bar--left" aria-hidden="true" />
          {titleHref ? (
            <Link href={titleHref}>
              <h2 className={`inline-flex h-[44px] items-center px-3 ${titleClassName} font-semibold uppercase font-raleway tracking-[0.05em] transition-colors text-[#5d514c] bg-white dark:bg-transparent hover:text-[#261e19] dark:hover:text-[#d8d4d3]`}>
                {title}
              </h2>
            </Link>
          ) : (
            <h2 className={`inline-flex h-[44px] items-center px-3 ${titleClassName} font-semibold uppercase font-raleway tracking-[0.05em] transition-colors text-[#5d514c] bg-white dark:bg-transparent hover:text-[#261e19] dark:hover:text-[#d8d4d3]`}>
              {title}
            </h2>
          )}
          <div className="h-[44px] flex-1 subcat-bar subcat-bar--right" aria-hidden="true" />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-[10.5px] sm:text-[14px] font-bold uppercase tracking-[0.08em] text-slate-700 dark:text-slate-200">{labels.novedades}</p>
        <NewsCarousel posts={getLocalizedPosts(posts)} />
        {moreHref ? (
          <Link href={moreHref}>
            <p className="group relative text-right text-[10.5px] sm:text-[14px] font-bold uppercase tracking-[0.08em] text-slate-700 dark:text-slate-200 transition-colors duration-200 hover:text-[#00BFFF] dark:hover:text-[#33ceff]">
              <span className="relative inline-block">
                {labels.verMas}
                <span className="absolute left-0 right-0 bottom-0 h-px origin-left scale-x-0 transition-transform duration-200 ease-out bg-gradient-to-r from-[#00BFFF] to-[#33ceff] group-hover:scale-x-100 dark:from-[#33ceff] dark:to-[#66deff] will-change: transform" aria-hidden="true" />
              </span>
            </p>
          </Link>
        ) : (
          <p className="group relative text-right text-[10.5px] sm:text-[14px] font-bold uppercase tracking-[0.08em] text-slate-700 dark:text-slate-200 transition-colors duration-200 hover:text-[#00BFFF] dark:hover:text-[#33ceff]">
            <span className="relative inline-block">
              {labels.verMas}
              <span className="absolute left-0 right-0 bottom-0 h-px origin-left scale-x-0 transition-transform duration-200 ease-out bg-gradient-to-r from-[#00BFFF] to-[#33ceff] group-hover:scale-x-100 dark:from-[#33ceff] dark:to-[#66deff] will-change: transform" aria-hidden="true" />
            </span>
          </p>
        )}
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
        title={labels.proveedores}
        posts={proveedoresData}
        titleHref="/categoria/infraestructura-social/proveedores-de-materiales"
        moreHref="/categoria/infraestructura-social/proveedores-de-materiales"
      />
      <section aria-label={labels.bannerProveedores} className="m-0 p-0">
        <h2 className="sr-only">{labels.bannerProveedores}</h2>
        <BaseBanner slides={proveedoresSlides} aspectRatioOverride={0.25} />
      </section>

      <SectionBlock
        title={labels.desarrolladores}
        posts={desarrolladoresData}
        titleHref="/categoria/infraestructura-social/desarrolladores-de-proyectos"
        moreHref="/categoria/infraestructura-social/desarrolladores-de-proyectos"
        titleClassName="text-[13.5px] sm:text-lg lg:text-xl"
      />
      <section aria-label={labels.bannerDesarrolladores} className="m-0 p-0">
        <h2 className="sr-only">{labels.bannerDesarrolladores}</h2>
        <BaseBanner slides={desarrolladoresSlides} aspectRatioOverride={0.25} />
      </section>

      <SectionBlock
        title={labels.promotores}
        posts={promotoresData}
        titleHref="/categoria/infraestructura-social/promotores-inmobiliarios"
        moreHref="/categoria/infraestructura-social/promotores-inmobiliarios"
      />
      <section aria-label={labels.bannerPromotores} className="m-0 p-0">
        <h2 className="sr-only">{labels.bannerPromotores}</h2>
        <BaseBanner slides={promotoresSlides} aspectRatioOverride={0.25} />
      </section>

      <style>{`
        @property --subcat-grad-pos {
          syntax: "<percentage>";
          inherits: true;
          initial-value: 0%;
        }
        .subcat-bar {
          --subcat-grad-pos: 0%;
          background: linear-gradient(90deg, #5d514c, #958b87, #d8d4d3);
          background-size: 300% 100%;
          background-position: var(--subcat-grad-pos, 0%) 0;
        }
        .subcat-bar--left {
          background: #5d514c;
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
          0% { background-color: #5d514c; }
          50% { background-color: #d8d4d3; }
          100% { background-color: #5d514c; }
        }
      `}</style>
    </main>
  );
}
