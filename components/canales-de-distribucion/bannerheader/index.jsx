"use client";

import BaseBanner from "../../banners/BaseBanner";
import bannerCanales from "../../../Imagenes/Banners-Pagina-Web/Subcategorias/Banner-Canales-de-Distribuci\u00F3n.png";

const slides = [{ id: "canales-de-distribucion", src: bannerCanales, alt: "Canales de Distribución" }];

export default function BannerWrapper() {
  return <BaseBanner slides={slides} />;
}
