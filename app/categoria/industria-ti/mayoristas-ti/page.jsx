"use client";

import BannerMayoristas from "../../../../components/mayoristas-ti/bannerheader";
import SubcategoryListPage from "../../../../components/category/SubcategoryListPage";

export default function MayoristasTiPage() {
  return (
    <SubcategoryListPage
      titleEs="Mayoristas TI" title="IT Wholesalers"
      categorySlug="industria-ti"
      subcategorySlug="mayoristas-ti"
      barColor="#0069b4"
      gradientFrom="#c8d5ef"
      BannerComponent={BannerMayoristas}
    />
  );
}
