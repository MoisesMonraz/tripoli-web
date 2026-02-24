"use client";

import BaseBanner from "../../banners/BaseBanner";
import bannerConveniencia from "../../../Imagenes/Banners-Pagina-Web/Subcategorias/Banner-Negocios-de-Conveniencia.png";

const slides = [{ id: "negocios-de-conveniencia", src: bannerConveniencia, alt: "Negocios de Conveniencia" }];

export default function BannerWrapper() {
  return <BaseBanner slides={slides} />;
}
