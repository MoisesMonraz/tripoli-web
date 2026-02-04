import { getArticlesBySubcategory } from "../../../../lib/contentful";
import SubcategoryListPageClient from "../../../../components/category/SubcategoryListPageClient";
import BannerEquipos from "../../../../components/fabricantes-equipos-insumos/bannerheader";

export default async function FabricantesEquipoInsumosPage() {
  const posts = await getArticlesBySubcategory("sector-salud", "fabricantes-equipos-insumos", 50);

  return (
    <SubcategoryListPageClient
      titleEs="Fabricantes de Equipos e Insumos" title="Equipment and Supplies Manufacturers"
      categorySlug="sector-salud"
      subcategorySlug="fabricantes-equipos-insumos"
      barColor="#e6007e"
      gradientMid="#f29fc5"
      gradientFrom="#f9d3e6"
      initialPosts={posts}
      BannerComponent={BannerEquipos}
    />
  );
}

export const revalidate = 1800;
