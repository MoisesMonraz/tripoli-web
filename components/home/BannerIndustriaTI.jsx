"use client";

import BaseBanner from "../banners/BaseBanner";
import bannerIndustria from "../../Imagenes/Banners-Pagina-Web/Banner Industria T.I..png";

const slides = [{ id: "industria", src: bannerIndustria, alt: "Industria TI" }];

export default function BannerIndustriaTI() {
  return <BaseBanner slides={slides} />;
}
