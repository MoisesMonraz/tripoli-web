"use client";

import BannerMateriales from "../../../../components/proveedores-de-materiales/bannerheader";
import SubcategoryListPage from "../../../../components/category/SubcategoryListPage";

export default function ProveedoresDeMaterialesPage() {
  return (
    <SubcategoryListPage
      titleEs="Proveedores de Materiales" title="Materials Suppliers"
      categorySlug="infraestructura-social"
      subcategorySlug="proveedores-de-materiales"
      barColor="#5d514c"
      gradientMid="#958b87"
      gradientFrom="#d8d4d3"
      BannerComponent={BannerMateriales}
    />
  );
}
