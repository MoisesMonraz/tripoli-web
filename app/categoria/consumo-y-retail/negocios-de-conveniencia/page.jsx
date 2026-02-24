import { getArticlesBySubcategory } from "../../../../lib/contentful";
import SubcategoryListPageClient from "../../../../components/category/SubcategoryListPageClient";
import BannerConveniencia from "../../../../components/negocios-de-conveniencia/bannerheader";

export default async function NegociosDeConvenienciaPage() {
  const posts = await getArticlesBySubcategory("consumo-y-retail", "negocios-de-conveniencia", 50);

  return (
    <SubcategoryListPageClient
      titleEs="Negocios de Conveniencia" title="Convenience Businesses"
      categorySlug="consumo-y-retail"
      subcategorySlug="negocios-de-conveniencia"
      barColor="#f39200"
      gradientFrom="#fee5c8"
      gradientMid="#fdc652"
      initialPosts={posts}
      BannerComponent={BannerConveniencia}
    />
  );
}

export const revalidate = 1800;
