"use client";

import BannerFabricantesTec from "../../../../components/fabricantes-de-tecnologia/bannerheader";
import SubcategoryListPage from "../../../../components/category/SubcategoryListPage";

export default function FabricantesDeTecnologiaPage() {
  return (
    <SubcategoryListPage
      titleEs="Fabricantes de Tecnología"
      title="Technology Manufacturers"
      categorySlug="industria-ti"
      subcategorySlug="fabricantes-de-tecnologia"
      barColor="#0069b4"
      gradientFrom="#c8d5ef"
      BannerComponent={BannerFabricantesTec}
    />
  );
}
