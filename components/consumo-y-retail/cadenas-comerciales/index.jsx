"use client";

import BaseBanner from "../../banners/BaseBanner";
import bannerCadenas from "../../../Imagenes/Banners-Pagina-Web/Subcategorias/Banner-Cadenas-Comerciales.png";

const slides = [{ id: "cadenas-comerciales", src: bannerCadenas, alt: "Cadenas Comerciales" }];

export default function BannerWrapper() {
  return <BaseBanner slides={slides} />;
}
