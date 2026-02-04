"use client";

import BaseBanner from "./BaseBanner";

const bannerMap = {
  "cadenas-comerciales": "/images/banners/subcategorias/banner-cadenas-comerciales.png",
  "tiendas-de-conveniencia": "/images/banners/subcategorias/banner-tiendas-de-conveniencia.png",
  "productoras-de-contenido": "/images/banners/subcategorias/banner-productoras-de-contenido.png",
  "recintos-culturales": "/images/banners/subcategorias/banner-recintos-culturales.png",
  "festivales-eventos-artistas": "/images/banners/subcategorias/banner-festivales-eventos-artistas.png",
  "fabricantes-de-tecnologia": "/images/banners/subcategorias/banner-fabricantes-de-tecnologia.png",
  "mayoristas-ti": "/images/banners/subcategorias/banner-mayoristas-ti.png",
  "canales-de-distribucion": "/images/banners/subcategorias/banner-canales-de-distribucion.png",
  "proveedores-de-materiales": "/images/banners/subcategorias/banner-proveedores-de-materiales.png",
  "desarrolladores-de-proyectos": "/images/banners/subcategorias/banner-desarrolladores-de-proyectos.png",
  "promotores-inmobiliarios": "/images/banners/subcategorias/banner-promotores-inmobiliarios.png",
  "organismos-publicos": "/images/banners/subcategorias/banner-organismos-publicos.png",
  "administracion-publica": "/images/banners/subcategorias/banner-administracion-publica.png",
  "servicios-juridicos": "/images/banners/subcategorias/banner-servicios-juridicos.png",
  "fabricantes-equipos-insumos": "/images/banners/subcategorias/banner-fabricantes-equipos-insumos.png",
  "instituciones-de-salud": "/images/banners/subcategorias/banner-instituciones-de-salud.png",
  "especialistas-medicos": "/images/banners/subcategorias/banner-especialistas-medicos.png",
  // "fabricantes-y-proveedores" is intentionally handled separately and not routed here.
};

const defaultBanner = "/images/banners/banner-tripoli-media.png";
const analyticsBanner = { id: "analytics", src: "/banners/banner-analytic-services.png", alt: "Tripoli Analytics Services" };
const webBanner = { id: "web", src: "/banners/banner-web-services.png", alt: "Tripoli Web Services" };

export default function SubcategoryBanner({ subcategorySlug }) {
  const bannerSrc = bannerMap[subcategorySlug] ?? defaultBanner;
  const altText =
    subcategorySlug?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ||
    "Banner";
  const slides = [
    { id: subcategorySlug || "subcategory-banner", src: bannerSrc, alt: altText },
    analyticsBanner,
    webBanner,
  ];
  return <BaseBanner slides={slides} />;
}
