import { getArticlesBySubcategory } from "../../../../lib/contentful";
import SubcategoryListPageClient from "../../../../components/category/SubcategoryListPageClient";
import BannerCanales from "../../../../components/canales-de-distribucion/bannerheader";

export default async function CanalesDeDistribucionPage() {
  const posts = await getArticlesBySubcategory("industria-ti", "canales-de-distribucion", 50);

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

export const revalidate = 1800;
