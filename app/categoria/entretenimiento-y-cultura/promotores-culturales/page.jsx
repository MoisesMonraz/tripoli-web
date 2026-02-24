import { getArticlesBySubcategory } from "../../../../lib/contentful";
import SubcategoryListPageClient from "../../../../components/category/SubcategoryListPageClient";
import BannerPromotores from "../../../../components/promotores-culturales/bannerheader";

export default async function PromotoresCulturalesPage() {
  const posts = await getArticlesBySubcategory("entretenimiento-y-cultura", "promotores-culturales", 50);

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

export const revalidate = 1800;
