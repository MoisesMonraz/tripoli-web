import { getArticlesBySubcategory } from "../../../../lib/contentful";
import { getRevistasBySubcategory, revistaToPost } from "../../../../lib/revistas";
import SubcategoryListPageClient from "../../../../components/category/SubcategoryListPageClient";
import BannerPromotores from "../../../../components/promotores-inmobiliarios/bannerheader";

export default async function PromotoresInmobiliariosPage() {
  const [articlePosts, revistaItems] = await Promise.all([
    getArticlesBySubcategory("infraestructura-social", "promotores-inmobiliarios", 50),
    getRevistasBySubcategory("promotores-inmobiliarios"),
  ]);
  const posts = [...articlePosts, ...revistaItems.map(revistaToPost)].sort(
    (a, b) => new Date(b.dateISO || 0).getTime() - new Date(a.dateISO || 0).getTime()
  );

  return (
    <SubcategoryListPageClient
      titleEs="Promotores Inmobiliarios" title="Real Estate Promoters"
      categorySlug="infraestructura-social"
      subcategorySlug="promotores-inmobiliarios"
      barColor="#5d514c"
      gradientMid="#958b87"
      gradientFrom="#d8d4d3"
      initialPosts={posts}
      BannerComponent={BannerPromotores}
    />
  );
}

export const revalidate = 3600;
