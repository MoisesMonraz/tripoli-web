"use client";

import BannerDesarrolladores from "../../../../components/desarrolladores-de-proyectos/bannerheader";
import SubcategoryListPage from "../../../../components/category/SubcategoryListPage";

export default function DesarrolladoresDeProyectosPage() {
  return (
    <SubcategoryListPage
      titleEs="Desarrolladores de Proyectos" title="Project Developers"
      categorySlug="infraestructura-social"
      subcategorySlug="desarrolladores-de-proyectos"
      barColor="#5d514c"
      gradientMid="#958b87"
      gradientFrom="#d8d4d3"
      BannerComponent={BannerDesarrolladores}
    />
  );
}
