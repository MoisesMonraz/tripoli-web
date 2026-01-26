"use client";

import BaseBanner from "../../banners/BaseBanner";
import bannerMayoristas from "../../../Imagenes/Banners-Pagina-Web/Subcategorias/Banner-Mayoristas-TI.png";

const slides = [{ id: "mayoristas-ti", src: bannerMayoristas, alt: "Mayoristas TI" }];

export default function BannerWrapper() {
  return <BaseBanner slides={slides} />;
}
