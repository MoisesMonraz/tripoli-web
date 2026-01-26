"use client";

import BannerOrganismos from "../../../../components/organismos-publicos/bannerheader";
import SubcategoryListPage from "../../../../components/category/SubcategoryListPage";

export default function OrganismosPublicosPage() {
  return (
    <SubcategoryListPage
      titleEs="Organismos Públicos" title="Public Bodies"
      categorySlug="politica-y-leyes"
      subcategorySlug="organismos-publicos"
      barColor="#312783"
      gradientMid="#9185be"
      gradientFrom="#c8c1e1"
      BannerComponent={BannerOrganismos}
    />
  );
}
