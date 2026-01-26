"use client";

import BaseBanner from "../banners/BaseBanner";
import bannerSalud from "../../Imagenes/Banners-Pagina-Web/Banner Sector Salud.png";

const slides = [{ id: "salud", src: bannerSalud, alt: "Sector Salud" }];

export default function BannerSectorsalud() {
  return <BaseBanner slides={slides} />;
}
