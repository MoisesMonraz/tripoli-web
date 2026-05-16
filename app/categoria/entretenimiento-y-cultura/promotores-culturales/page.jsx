import { getArticlesBySubcategory } from "../../../../lib/contentful";
import { getRevistasBySubcategory, revistaToPost } from "../../../../lib/revistas";
import SubcategoryListPageClient from "../../../../components/category/SubcategoryListPageClient";
import BannerPromotores from "../../../../components/promotores-culturales/bannerheader";

export default async function PromotoresCulturalesPage() {
  const [articlePosts, revistaItems] = await Promise.all([
    getArticlesBySubcategory("entretenimiento-y-cultura", "promotores-culturales", 50),
    getRevistasBySubcategory("promotores-culturales"),
  ]);
  const posts = [...articlePosts, ...revistaItems.map(revistaToPost)].sort(
    (a, b) => new Date(b.dateISO || 0).getTime() - new Date(a.dateISO || 0).getTime()
  );

  return (
    <SubcategoryListPageClient
      titleEs="Promotores Culturales" title="Cultural Promoters"
      categorySlug="entretenimiento-y-cultura"
      subcategorySlug="promotores-culturales"
      barColor="#009640"
      gradientFrom="#cce5ce"
      initialPosts={posts}
      BannerComponent={BannerPromotores}
    />
  );
}

export const revalidate = 3600;
