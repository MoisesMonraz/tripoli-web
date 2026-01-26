"use client";

import BannerRecintos from "../../../../components/recintos-culturales/bannerheader";
import SubcategoryListPage from "../../../../components/category/SubcategoryListPage";

export default function RecintosCulturalesPage() {
  return (
    <SubcategoryListPage
      titleEs="Recintos Culturales" title="Cultural Venues"
      categorySlug="entretenimiento-y-cultura"
      subcategorySlug="recintos-culturales"
      barColor="#009640"
      gradientFrom="#cce5ce"
      BannerComponent={BannerRecintos}
    />
  );
}
