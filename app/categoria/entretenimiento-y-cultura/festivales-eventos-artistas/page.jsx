"use client";

import BannerFestivales from "../../../../components/festivales-eventos-y-artistas/bannerheader";
import SubcategoryListPage from "../../../../components/category/SubcategoryListPage";

export default function FestivalesEventosArtistasPage() {
  return (
    <SubcategoryListPage
      titleEs="Festivales, Eventos y Artistas" title="Festivals, Events and Artists"
      categorySlug="entretenimiento-y-cultura"
      subcategorySlug="festivales-eventos-artistas"
      barColor="#009640"
      gradientFrom="#cce5ce"
      BannerComponent={BannerFestivales}
    />
  );
}
