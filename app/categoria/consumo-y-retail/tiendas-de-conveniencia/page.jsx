import { getArticlesBySubcategory } from "../../../../lib/contentful";
import SubcategoryListPageClient from "../../../../components/category/SubcategoryListPageClient";
import BannerConveniencia from "../../../../components/tiendas-de-conveniencia/bannerheader";

export default async function TiendasDeConvenienciaPage() {
  const posts = await getArticlesBySubcategory("consumo-y-retail", "tiendas-de-conveniencia", 50);

  return (
    <SubcategoryListPageClient
      titleEs="Tiendas de Conveniencia" title="Convenience Stores"
      categorySlug="consumo-y-retail"
      subcategorySlug="tiendas-de-conveniencia"
      barColor="#f39200"
      gradientFrom="#fee5c8"
      gradientMid="#fdc652"
      initialPosts={posts}
      BannerComponent={BannerConveniencia}
    />
  );
}

export const revalidate = 1800;
