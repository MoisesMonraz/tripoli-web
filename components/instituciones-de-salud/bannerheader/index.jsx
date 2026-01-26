"use client";

import BaseBanner from "../../banners/BaseBanner";
import bannerInstituciones from "../../../Imagenes/Banners-Pagina-Web/Subcategorias/Banner-Instituciones-de-Salud.png";

const slides = [{ id: "instituciones-de-salud", src: bannerInstituciones, alt: "Instituciones de Salud" }];

export default function BannerWrapper() {
  return <BaseBanner slides={slides} />;
}
