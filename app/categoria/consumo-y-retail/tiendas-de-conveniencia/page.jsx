"use client";

import BannerConveniencia from "../../../../components/tiendas-de-conveniencia/bannerheader";
import SubcategoryListPage from "../../../../components/category/SubcategoryListPage";

export default function TiendasDeConvenienciaPage() {
  return (
    <SubcategoryListPage
      titleEs="Tiendas de Conveniencia" title="Convenience Stores"
      categorySlug="consumo-y-retail"
      subcategorySlug="tiendas-de-conveniencia"
      barColor="#f39200"
      gradientFrom="#fee5c8"
      gradientMid="#fdc652"
      BannerComponent={BannerConveniencia}
    />
  );
}
