"use client";

import BaseBanner from "../../banners/BaseBanner";
import bannerEspecialistas from "../../../Imagenes/Banners-Pagina-Web/Subcategorias/Banner-Especialistas-M\u00E9dicos.png";

const slides = [{ id: "especialistas-medicos", src: bannerEspecialistas, alt: "Especialistas Médicos" }];

export default function BannerWrapper() {
  return <BaseBanner slides={slides} />;
}
