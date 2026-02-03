"use client";

import BaseBanner from "../../banners/BaseBanner";
import bannerAdministracion from "../../../Imagenes/Banners-Pagina-Web/Subcategorias/Banner-Administración-Pública.png";

const slides = [{ id: "administracion-publica", src: bannerAdministracion, alt: "Administración Pública" }];

export default function BannerWrapper() {
  return <BaseBanner slides={slides} />;
}
