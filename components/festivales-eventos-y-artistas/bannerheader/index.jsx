"use client";

import BaseBanner from "../../banners/BaseBanner";
import bannerFestivales from "../../../Imagenes/Banners-Pagina-Web/Subcategorias/Banner-Festivales-Eventos-y-Artistas.png";

const slides = [{ id: "festivales-eventos-artistas", src: bannerFestivales, alt: "Festivales, Eventos y Artistas" }];

export default function BannerWrapper() {
  return <BaseBanner slides={slides} />;
}
