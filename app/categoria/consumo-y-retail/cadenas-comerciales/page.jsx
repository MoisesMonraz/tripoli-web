import { getArticlesBySubcategory } from "../../../../lib/contentful";
import { getRevistasBySubcategory, revistaToPost } from "../../../../lib/revistas";
import SubcategoryListPageClient from "../../../../components/category/SubcategoryListPageClient";
import BannerCadenas from "../../../../components/cadenas-comerciales/bannerheader";

export default async function CadenasComercialesPage() {
  const [articlePosts, revistaItems] = await Promise.all([
    getArticlesBySubcategory("consumo-y-retail", "cadenas-comerciales", 50),
    getRevistasBySubcategory("cadenas-comerciales"),
  ]);
  const posts = [...articlePosts, ...revistaItems.map(revistaToPost)].sort(
    (a, b) => new Date(b.dateISO || 0).getTime() - new Date(a.dateISO || 0).getTime()
  );

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

export const revalidate = 3600;
