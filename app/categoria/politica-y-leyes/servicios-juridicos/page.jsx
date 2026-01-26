"use client";

import BannerJuridicos from "../../../../components/servicios-juridicos/bannerheader";
import SubcategoryListPage from "../../../../components/category/SubcategoryListPage";

export default function ServiciosJuridicosPage() {
  return (
    <SubcategoryListPage
      titleEs="Servicios Jurídicos" title="Legal Services"
      categorySlug="politica-y-leyes"
      subcategorySlug="servicios-juridicos"
      barColor="#312783"
      gradientMid="#9185be"
      gradientFrom="#c8c1e1"
      BannerComponent={BannerJuridicos}
    />
  );
}
