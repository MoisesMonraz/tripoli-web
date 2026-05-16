import { getArticlesBySubcategory } from "../../../../lib/contentful";
import { getRevistasBySubcategory, revistaToPost } from "../../../../lib/revistas";
import SubcategoryListPageClient from "../../../../components/category/SubcategoryListPageClient";
import BannerConveniencia from "../../../../components/negocios-de-conveniencia/bannerheader";

export default async function NegociosDeConvenienciaPage() {
  const [articlePosts, revistaItems] = await Promise.all([
    getArticlesBySubcategory("consumo-y-retail", "negocios-de-conveniencia", 50),
    getRevistasBySubcategory("negocios-de-conveniencia"),
  ]);
  const posts = [...articlePosts, ...revistaItems.map(revistaToPost)].sort(
    (a, b) => new Date(b.dateISO || 0).getTime() - new Date(a.dateISO || 0).getTime()
  );

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

export const revalidate = 3600;
