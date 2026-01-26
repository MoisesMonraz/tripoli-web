"use client";

import BannerProductoras from "../../../../components/productoras-de-contenido/bannerheader";
import SubcategoryListPage from "../../../../components/category/SubcategoryListPage";

export default function ProductorasDeContenidoPage() {
  return (
    <SubcategoryListPage
      titleEs="Productoras de Contenido" title="Content Producers"
      categorySlug="entretenimiento-y-cultura"
      subcategorySlug="productoras-de-contenido"
      barColor="#009640"
      gradientFrom="#cce5ce"
      BannerComponent={BannerProductoras}
    />
  );
}
