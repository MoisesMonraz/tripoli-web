"use client";

import BaseBanner from "../../banners/BaseBanner";
import bannerProductoras from "../../../Imagenes/Banners-Pagina-Web/Subcategorias/Banner-Productoras-de-Contenido.png";

const slides = [{ id: "productoras-de-contenido", src: bannerProductoras, alt: "Productoras de Contenido" }];

export default function BannerWrapper() {
  return <BaseBanner slides={slides} />;
}
