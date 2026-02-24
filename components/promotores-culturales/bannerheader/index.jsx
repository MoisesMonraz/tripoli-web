"use client";

import BaseBanner from "../../banners/BaseBanner";
import bannerPromotores from "../../../Imagenes/Banners-Pagina-Web/Subcategorias/Banner-Promotores-Culturales.png";

const slides = [{ id: "promotores-culturales", src: bannerPromotores, alt: "Promotores Culturales" }];

export default function BannerWrapper() {
  return <BaseBanner slides={slides} />;
}
