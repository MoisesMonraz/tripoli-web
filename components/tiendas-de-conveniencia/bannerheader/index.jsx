"use client";

import BaseBanner from "../../banners/BaseBanner";
import bannerConveniencia from "../../../Imagenes/Banners-Pagina-Web/Subcategorias/Banner-Tiendas-de-Conveniencia.png";

const slides = [{ id: "tiendas-de-conveniencia", src: bannerConveniencia, alt: "Tiendas de Conveniencia" }];

export default function BannerWrapper() {
  return <BaseBanner slides={slides} />;
}
