"use client";

import BannerCanales from "../../../../components/canales-de-distribucion/bannerheader";
import SubcategoryListPage from "../../../../components/category/SubcategoryListPage";

export default function CanalesDeDistribucionPage() {
  return (
    <SubcategoryListPage
      titleEs="Canales de Distribución"
      title="Distribution Channels"
      categorySlug="industria-ti"
      subcategorySlug="canales-de-distribucion"
      barColor="#0069b4"
      gradientFrom="#c8d5ef"
      BannerComponent={BannerCanales}
    />
  );
}
