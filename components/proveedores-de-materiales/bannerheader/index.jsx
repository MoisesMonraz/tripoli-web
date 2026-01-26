"use client";

import BaseBanner from "../../banners/BaseBanner";
import bannerMateriales from "../../../Imagenes/Banners-Pagina-Web/Subcategorias/Banner-Proveedores-de-Materiales.png";

const slides = [{ id: "proveedores-de-materiales", src: bannerMateriales, alt: "Proveedores de Materiales" }];

export default function BannerWrapper() {
  return <BaseBanner slides={slides} />;
}
