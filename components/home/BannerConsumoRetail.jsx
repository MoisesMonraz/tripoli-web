"use client";

import BaseBanner from "../banners/BaseBanner";
import bannerConsumo from "../../Imagenes/Banners-Pagina-Web/Banner Consumo y Retail.png";

const slides = [{ id: "consumo", src: bannerConsumo, alt: "Consumo y Retail" }];

export default function BannerConsumoRetail() {
  return <BaseBanner slides={slides} />;
}
