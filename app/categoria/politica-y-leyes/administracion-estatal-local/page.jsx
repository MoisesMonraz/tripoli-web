"use client";

import BannerAdministracion from "../../../../components/administracion-estatal-local/bannerheader";
import SubcategoryListPage from "../../../../components/category/SubcategoryListPage";

export default function AdministracionEstatalLocalPage() {
  return (
    <SubcategoryListPage
      titleEs="Administración Estatal y Local" title="State and Local Administration"
      categorySlug="politica-y-leyes"
      subcategorySlug="administracion-estatal-local"
      barColor="#312783"
      gradientMid="#9185be"
      gradientFrom="#c8c1e1"
      BannerComponent={BannerAdministracion}
    />
  );
}
