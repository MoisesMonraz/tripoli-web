"use client";

import BannerEquipos from "../../../../components/fabricantes-equipo-insumos/bannerheader";
import SubcategoryListPage from "../../../../components/category/SubcategoryListPage";

export default function FabricantesEquipoInsumosPage() {
  return (
    <SubcategoryListPage
      titleEs="Fabricantes de Equipos e Insumos" title="Equipment and Supplies Manufacturers"
      categorySlug="sector-salud"
      subcategorySlug="fabricantes-equipo-insumos"
      barColor="#e6007e"
      gradientMid="#f29fc5"
      gradientFrom="#f9d3e6"
      BannerComponent={BannerEquipos}
    />
  );
}
