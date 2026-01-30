import { getArticlesBySubcategory } from "../../../../lib/contentful";
import SubcategoryListPageClient from "../../../../components/category/SubcategoryListPageClient";
import BannerPromotores from "../../../../components/promotores-inmobiliarios/bannerheader";

export default async function PromotoresInmobiliariosPage() {
  const posts = await getArticlesBySubcategory("infraestructura-social", "promotores-inmobiliarios", 50);

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

export const revalidate = 1800;
