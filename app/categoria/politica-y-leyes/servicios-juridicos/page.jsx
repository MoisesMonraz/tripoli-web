import { getArticlesBySubcategory } from "../../../../lib/contentful";
import { getRevistasBySubcategory, revistaToPost } from "../../../../lib/revistas";
import SubcategoryListPageClient from "../../../../components/category/SubcategoryListPageClient";
import BannerJuridicos from "../../../../components/servicios-juridicos/bannerheader";

export default async function ServiciosJuridicosPage() {
  const [articlePosts, revistaItems] = await Promise.all([
    getArticlesBySubcategory("politica-y-leyes", "servicios-juridicos", 50),
    getRevistasBySubcategory("servicios-juridicos"),
  ]);
  const posts = [...articlePosts, ...revistaItems.map(revistaToPost)].sort(
    (a, b) => new Date(b.dateISO || 0).getTime() - new Date(a.dateISO || 0).getTime()
  );

  return (
    <SubcategoryListPageClient
      titleEs="Servicios Jurídicos" title="Legal Services"
      categorySlug="politica-y-leyes"
      subcategorySlug="servicios-juridicos"
      barColor="#312783"
      gradientMid="#9185be"
      gradientFrom="#c8c1e1"
      initialPosts={posts}
      BannerComponent={BannerJuridicos}
    />
  );
}

export const revalidate = 3600;
