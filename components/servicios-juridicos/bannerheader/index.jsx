"use client";

import BaseBanner from "../../banners/BaseBanner";
import bannerJuridicos from "../../../Imagenes/Banners-Pagina-Web/Subcategorias/Banner-Servicios-Jur\u00EDdicos.png";

const slides = [{ id: "servicios-juridicos", src: bannerJuridicos, alt: "Servicios Jurídicos" }];

export default function BannerWrapper() {
  return <BaseBanner slides={slides} />;
}
