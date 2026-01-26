"use client";

import BaseBanner from "../../banners/BaseBanner";
import bannerAdministracion from "../../../Imagenes/Banners-Pagina-Web/Subcategorias/Banner-Administraci\u00F3n-Estatal-y-Local.png";

const slides = [{ id: "administracion-estatal-local", src: bannerAdministracion, alt: "Administración Estatal y Local" }];

export default function BannerWrapper() {
  return <BaseBanner slides={slides} />;
}
