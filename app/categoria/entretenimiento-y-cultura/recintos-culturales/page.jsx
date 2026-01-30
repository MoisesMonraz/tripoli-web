import { getArticlesBySubcategory } from "../../../../lib/contentful";
import SubcategoryListPageClient from "../../../../components/category/SubcategoryListPageClient";
import BannerRecintos from "../../../../components/recintos-culturales/bannerheader";

export default async function RecintosCulturalesPage() {
  const posts = await getArticlesBySubcategory("entretenimiento-y-cultura", "recintos-culturales", 50);

  return (
    <SubcategoryListPageClient
      titleEs="Recintos Culturales" title="Cultural Venues"
      categorySlug="entretenimiento-y-cultura"
      subcategorySlug="recintos-culturales"
      barColor="#009640"
      gradientFrom="#cce5ce"
      initialPosts={posts}
      BannerComponent={BannerRecintos}
    />
  );
}

export const revalidate = 1800;
