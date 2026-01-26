"use client";

import BaseBanner from "../../banners/BaseBanner";
import bannerPromotores from "../../../Imagenes/Banners-Pagina-Web/Subcategorias/Banner-Promotores-Inmobiliarios.png";

const slides = [{ id: "promotores-inmobiliarios", src: bannerPromotores, alt: "Promotores Inmobiliarios" }];

export default function BannerWrapper() {
  return <BaseBanner slides={slides} />;
}
