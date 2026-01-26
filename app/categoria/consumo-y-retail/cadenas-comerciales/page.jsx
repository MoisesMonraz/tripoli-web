"use client";

import BannerCadenas from "../../../../components/cadenas-comerciales/bannerheader";
import SubcategoryListPage from "../../../../components/category/SubcategoryListPage";

export default function CadenasComercialesPage() {
  return (
    <SubcategoryListPage
      titleEs="Cadenas Comerciales" title="Retail Chains"
      categorySlug="consumo-y-retail"
      subcategorySlug="cadenas-comerciales"
      barColor="#f39200"
      gradientFrom="#fee5c8"
      gradientMid="#fdc652"
      BannerComponent={BannerCadenas}
    />
  );
}
