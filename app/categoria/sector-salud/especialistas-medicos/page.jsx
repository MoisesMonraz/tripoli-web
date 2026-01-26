"use client";

import BannerEspecialistas from "../../../../components/especialistas-medicos/bannerheader";
import SubcategoryListPage from "../../../../components/category/SubcategoryListPage";

export default function EspecialistasMedicosPage() {
  return (
    <SubcategoryListPage
      titleEs="Especialistas Médicos" title="Medical Specialists"
      categorySlug="sector-salud"
      subcategorySlug="especialistas-medicos"
      barColor="#e6007e"
      gradientMid="#f29fc5"
      gradientFrom="#f9d3e6"
      BannerComponent={BannerEspecialistas}
    />
  );
}
