"use client";

import BaseBanner from "../../banners/BaseBanner";
import bannerFabricantes from "../../../Imagenes/Banners-Pagina-Web/Subcategorias/Banner-Fabricantes-y-Proveedores.png";

// Use only the specific banner for esta subcategoría
const slides = [{ id: "fabricantes", src: bannerFabricantes, alt: "Fabricantes y Proveedores" }];

export default function BannerWrapper() {
  return <BaseBanner slides={slides} />;
}
