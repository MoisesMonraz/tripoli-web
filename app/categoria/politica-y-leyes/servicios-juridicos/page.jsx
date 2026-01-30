import { getArticlesBySubcategory } from "../../../../lib/contentful";
import SubcategoryListPageClient from "../../../../components/category/SubcategoryListPageClient";
import BannerJuridicos from "../../../../components/servicios-juridicos/bannerheader";

export default async function ServiciosJuridicosPage() {
  const posts = await getArticlesBySubcategory("politica-y-leyes", "servicios-juridicos", 50);

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

export const revalidate = 1800;
