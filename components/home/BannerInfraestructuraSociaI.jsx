"use client";

import BaseBanner from "../banners/BaseBanner";
import bannerInfra from "../../Imagenes/Banners-Pagina-Web/Banner Infraestructura Social.png";

const slides = [{ id: "infra", src: bannerInfra, alt: "Infraestructura Social" }];

export default function BannerInfraestructuraSociaI() {
  return <BaseBanner slides={slides} />;
}
