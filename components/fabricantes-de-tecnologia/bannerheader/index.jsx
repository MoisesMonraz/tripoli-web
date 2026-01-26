"use client";

import BaseBanner from "../../banners/BaseBanner";
import bannerFabricantesTec from "../../../Imagenes/Banners-Pagina-Web/Subcategorias/Banner-Fabricantes-de-Tecnolog\u00EDa.png";

const slides = [{ id: "fabricantes-de-tecnologia", src: bannerFabricantesTec, alt: "Fabricantes de Tecnología" }];

export default function BannerWrapper() {
  return <BaseBanner slides={slides} />;
}
