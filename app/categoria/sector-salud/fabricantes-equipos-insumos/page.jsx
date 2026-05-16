import { getArticlesBySubcategory } from "../../../../lib/contentful";
import { getRevistasBySubcategory, revistaToPost } from "../../../../lib/revistas";
import SubcategoryListPageClient from "../../../../components/category/SubcategoryListPageClient";
import BannerEquipos from "../../../../components/fabricantes-equipos-insumos/bannerheader";

export default async function FabricantesEquipoInsumosPage() {
  const [articlePosts, revistaItems] = await Promise.all([
    getArticlesBySubcategory("sector-salud", "fabricantes-equipos-insumos", 50),
    getRevistasBySubcategory("fabricantes-equipos-insumos"),
  ]);
  const posts = [...articlePosts, ...revistaItems.map(revistaToPost)].sort(
    (a, b) => new Date(b.dateISO || 0).getTime() - new Date(a.dateISO || 0).getTime()
  );

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

export const revalidate = 3600;
