"use client";

import BannerInstituciones from "../../../../components/instituciones-de-salud/bannerheader";
import SubcategoryListPage from "../../../../components/category/SubcategoryListPage";

export default function InstitucionesDeSaludPage() {
  return (
    <SubcategoryListPage
      titleEs="Instituciones de Salud" title="Healthcare Institutions"
      categorySlug="sector-salud"
      subcategorySlug="instituciones-de-salud"
      barColor="#e6007e"
      gradientMid="#f29fc5"
      gradientFrom="#f9d3e6"
      BannerComponent={BannerInstituciones}
    />
  );
}
