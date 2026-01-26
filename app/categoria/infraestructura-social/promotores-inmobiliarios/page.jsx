"use client";

import BannerPromotores from "../../../../components/promotores-inmobiliarios/bannerheader";
import SubcategoryListPage from "../../../../components/category/SubcategoryListPage";

export default function PromotoresInmobiliariosPage() {
  return (
    <SubcategoryListPage
      titleEs="Promotores Inmobiliarios" title="Real Estate Promoters"
      categorySlug="infraestructura-social"
      subcategorySlug="promotores-inmobiliarios"
      barColor="#5d514c"
      gradientMid="#958b87"
      gradientFrom="#d8d4d3"
      BannerComponent={BannerPromotores}
    />
  );
}
