"use client";

import BaseBanner from "../banners/BaseBanner";
import bannerPolitica from "../../Imagenes/Banners-Pagina-Web/Banner Politica y Leyes.png";

const slides = [{ id: "politica", src: bannerPolitica, alt: "Politica y Leyes" }];

export default function BannerPoliticaLeyes() {
  return <BaseBanner slides={slides} />;
}
