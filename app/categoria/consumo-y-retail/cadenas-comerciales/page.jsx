import { getArticlesBySubcategory } from "../../../../lib/contentful";
import SubcategoryListPageClient from "../../../../components/category/SubcategoryListPageClient";
import BannerCadenas from "../../../../components/cadenas-comerciales/bannerheader";

export default async function CadenasComercialesPage() {
  const posts = await getArticlesBySubcategory("consumo-y-retail", "cadenas-comerciales", 50);

  return (
    <SubcategoryListPageClient
      titleEs="Cadenas Comerciales" title="Retail Chains"
      categorySlug="consumo-y-retail"
      subcategorySlug="cadenas-comerciales"
      barColor="#f39200"
      gradientFrom="#fee5c8"
      gradientMid="#fdc652"
      initialPosts={posts}
      BannerComponent={BannerCadenas}
    />
  );
}

export const revalidate = 1800;
