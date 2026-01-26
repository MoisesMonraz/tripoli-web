"use client";

import BaseBanner from "../../banners/BaseBanner";
import bannerEquipos from "../../../Imagenes/Banners-Pagina-Web/Subcategorias/Banner-Fabricantes-de-Equipos-e-Insumos.png";

const slides = [{ id: "fabricantes-equipo-insumos", src: bannerEquipos, alt: "Fabricantes de Equipos e Insumos" }];

export default function BannerWrapper() {
  return <BaseBanner slides={slides} />;
}
