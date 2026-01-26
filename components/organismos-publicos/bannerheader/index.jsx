"use client";

import BaseBanner from "../../banners/BaseBanner";
import bannerOrganismos from "../../../Imagenes/Banners-Pagina-Web/Subcategorias/Banner-Organismos-P\u00FAblicos.png";

const slides = [{ id: "organismos-publicos", src: bannerOrganismos, alt: "Organismos Públicos" }];

export default function BannerWrapper() {
  return <BaseBanner slides={slides} />;
}
