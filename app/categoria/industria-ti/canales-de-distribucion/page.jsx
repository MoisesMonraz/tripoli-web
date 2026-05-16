import { getArticlesBySubcategory } from "../../../../lib/contentful";
import { getRevistasBySubcategory, revistaToPost } from "../../../../lib/revistas";
import SubcategoryListPageClient from "../../../../components/category/SubcategoryListPageClient";
import BannerCanales from "../../../../components/canales-de-distribucion/bannerheader";

export default async function CanalesDeDistribucionPage() {
  const [articlePosts, revistaItems] = await Promise.all([
    getArticlesBySubcategory("industria-ti", "canales-de-distribucion", 50),
    getRevistasBySubcategory("canales-de-distribucion"),
  ]);
  const posts = [...articlePosts, ...revistaItems.map(revistaToPost)].sort(
    (a, b) => new Date(b.dateISO || 0).getTime() - new Date(a.dateISO || 0).getTime()
  );

  return (
    <SubcategoryListPageClient
      titleEs="Canales de Distribución" title="Distribution Channels"
      categorySlug="industria-ti"
      subcategorySlug="canales-de-distribucion"
      barColor="#0069b4"
      gradientFrom="#c8d5ef"
      initialPosts={posts}
      BannerComponent={BannerCanales}
    />
  );
}

export const revalidate = 3600;
