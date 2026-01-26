"use client";

import BaseBanner from "../banners/BaseBanner";
import bannerEntretenimiento from "../../Imagenes/Banners-Pagina-Web/Banner Entretenimiento y Cultura.png";

const slides = [{ id: "entretenimiento", src: bannerEntretenimiento, alt: "Entretenimiento y Cultura" }];

export default function BannerEntretenimientoCultura() {
  return <BaseBanner slides={slides} />;
}
