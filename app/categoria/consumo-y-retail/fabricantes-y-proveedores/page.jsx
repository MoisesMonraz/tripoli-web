"use client";

import SubcategoryListPage from "../../../../components/category/SubcategoryListPage";
import BannerFabricantes from "../../../../components/fabricantes-y-proveedores/bannerheader";

export default function FabricantesYProveedoresPage() {
  return (
    <SubcategoryListPage
      titleEs="Fabricantes y Proveedores" title="Manufacturers and Suppliers"
      categorySlug="consumo-y-retail"
      subcategorySlug="fabricantes-y-proveedores"
      barColor="#f39200"
      gradientFrom="#fee5c8"
      gradientMid="#fdc652"
      BannerComponent={BannerFabricantes}
    />
  );
}
