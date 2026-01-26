"use client";

import BaseBanner from "../../banners/BaseBanner";
import bannerDesarrolladores from "../../../Imagenes/Banners-Pagina-Web/Subcategorias/Banner-Desarrolladores-de-Proyectos.png";

const slides = [{ id: "desarrolladores-de-proyectos", src: bannerDesarrolladores, alt: "Desarrolladores de Proyectos" }];

export default function BannerWrapper() {
  return <BaseBanner slides={slides} />;
}
