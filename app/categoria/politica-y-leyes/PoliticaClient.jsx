"use client";

import Link from "next/link";
import BaseBanner, { defaultSlides } from "../../../components/banners/BaseBanner";
import NewsCarousel from "../../../components/home/NewsCarousel";
import { useLanguage } from "../../../components/LanguageProvider";
import bannerPoliticaHero from "../../../Imagenes/Banners-Pagina-Web/Banner Politica y Leyes.png";

export default function PoliticaClient({ organismosData, administracionData, juridicosData }) {
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
    bannerHeader: isEnglish ? "Banner Header Politics & Law" : "Banner Header Politica y Leyes",
    fabricantes: isEnglish ? "Public Agencies" : "Organismos Públicos",
    cadenas: isEnglish ? "State & Local Administration" : "Administración Estatal y Local",
    conveniencia: isEnglish ? "Legal Services" : "Servicios Jurídicos",
    novedades: isEnglish ? "Latest news" : "Novedades",
    verMas: isEnglish ? "See more news" : "Ver más noticias",
    bannerFabricantes: isEnglish ? "Banner Public Agencies" : "Banner Organismos Públicos",
    bannerCadenas: isEnglish ? "Banner State & Local Administration" : "Banner Administración Estatal y Local",
    bannerConveniencia: isEnglish ? "Banner Legal Services" : "Banner Servicios Jurídicos",
  };

  const tailSlides = defaultSlides.slice(1);
  const heroSlides = [{ id: "politica-hero", src: bannerPoliticaHero, alt: "Politica y Leyes" }, ...tailSlides];
  const organismosSlides = [
    { id: "politica-organismos", src: "/images/banners/subcategorias/banner-organismos-publicos.png", alt: "Organismos Publicos" },
    ...tailSlides,
  ];
  const administracionSlides = [
    { id: "politica-administracion", src: "/images/banners/subcategorias/banner-administracion-estatal-y-local.png", alt: "Administracion Estatal y Local" },
    ...tailSlides,
  ];
  const juridicosSlides = [
    { id: "politica-juridicos", src: "/images/banners/subcategorias/banner-servicios-juridicos.png", alt: "Servicios Juridicos" },
    ...tailSlides,
  ];

  const SectionBlock = ({ title, posts, titleHref, moreHref }) => (
    <section className="flex flex-col gap-4 px-4 max-w-[70rem] mx-auto w-full sm:px-[12px] md:px-4">
      <div className="relative w-full">
        <div className="relative z-10 flex items-stretch gap-0">
          <span className="h-[44px] w-[8px] subcat-bar subcat-bar--left" aria-hidden="true" />
          {titleHref ? (
            <Link href={titleHref}>
              <h2 className="inline-flex h-[44px] items-center px-3 text-lg lg:text-xl font-semibold uppercase font-raleway tracking-[0.05em] transition-colors text-[#312783] bg-white dark:bg-transparent hover:text-[#211452] dark:hover:text-[#c8c1e1]">
                {title}
              </h2>
            </Link>
          ) : (
            <h2 className="inline-flex h-[44px] items-center px-3 text-lg lg:text-xl font-semibold uppercase font-raleway tracking-[0.05em] transition-colors text-[#312783] bg-white dark:bg-transparent hover:text-[#211452] dark:hover:text-[#c8c1e1]">
              {title}
            </h2>
          )}
          <div className="h-[44px] flex-1 subcat-bar subcat-bar--right" aria-hidden="true" />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-[14px] font-bold uppercase tracking-[0.08em] text-slate-700 dark:text-slate-200">{labels.novedades}</p>
        <NewsCarousel posts={getLocalizedPosts(posts)} />
        <Link
          href={moreHref || titleHref || "#"}
          className="group relative text-right text-[14px] font-bold uppercase tracking-[0.08em] text-slate-700 dark:text-slate-200 transition-colors duration-200 hover:text-[#00BFFF] dark:hover:text-[#33ceff] inline-block self-end"
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
        posts={organismosData}
        titleHref="/categoria/politica-y-leyes/organismos-publicos"
        moreHref="/categoria/politica-y-leyes/organismos-publicos"
      />
      <section aria-label={labels.bannerFabricantes} className="m-0 p-0">
        <h2 className="sr-only">{labels.bannerFabricantes}</h2>
        <BaseBanner slides={organismosSlides} aspectRatioOverride={0.25} />
      </section>

      <SectionBlock
        title={labels.cadenas}
        posts={administracionData}
        titleHref="/categoria/politica-y-leyes/administracion-estatal-local"
        moreHref="/categoria/politica-y-leyes/administracion-estatal-local"
      />
      <section aria-label={labels.bannerCadenas} className="m-0 p-0">
        <h2 className="sr-only">{labels.bannerCadenas}</h2>
        <BaseBanner slides={administracionSlides} aspectRatioOverride={0.25} />
      </section>

      <SectionBlock
        title={labels.conveniencia}
        posts={juridicosData}
        titleHref="/categoria/politica-y-leyes/servicios-juridicos"
        moreHref="/categoria/politica-y-leyes/servicios-juridicos"
      />
      <section aria-label={labels.bannerConveniencia} className="m-0 p-0">
        <h2 className="sr-only">{labels.bannerConveniencia}</h2>
        <BaseBanner slides={juridicosSlides} aspectRatioOverride={0.25} />
      </section>

      <style>{`
        @property --subcat-grad-pos {
          syntax: "<percentage>";
          inherits: true;
          initial-value: 0%;
        }
        .subcat-bar {
          --subcat-grad-pos: 0%;
          background: linear-gradient(90deg, #312783, #9185be, #c8c1e1);
          background-size: 300% 100%;
          background-position: var(--subcat-grad-pos, 0%) 0;
        }
        .subcat-bar--left {
          background: #312783;
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
          0% { background-color: #312783; }
          50% { background-color: #c8c1e1; }
          100% { background-color: #312783; }
        }
      `}</style>
    </main>
  );
}
