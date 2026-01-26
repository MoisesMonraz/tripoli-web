"use client";

import BaseBanner from "../../banners/BaseBanner";
import bannerRecintos from "../../../Imagenes/Banners-Pagina-Web/Subcategorias/Banner-Recintos-Culturales.png";

const slides = [{ id: "recintos-culturales", src: bannerRecintos, alt: "Recintos Culturales" }];

export default function BannerWrapper() {
  return <BaseBanner slides={slides} />;
}
