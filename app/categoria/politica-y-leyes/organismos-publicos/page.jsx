import { getArticlesBySubcategory } from "../../../../lib/contentful";
import SubcategoryListPageClient from "../../../../components/category/SubcategoryListPageClient";
import BannerOrganismos from "../../../../components/organismos-publicos/bannerheader";

export default async function OrganismosPublicosPage() {
  const posts = await getArticlesBySubcategory("politica-y-leyes", "organismos-publicos", 50);

  return (
    <SubcategoryListPageClient
      titleEs="Organismos Públicos" title="Public Bodies"
      categorySlug="politica-y-leyes"
      subcategorySlug="organismos-publicos"
      barColor="#312783"
      gradientMid="#9185be"
      gradientFrom="#c8c1e1"
      initialPosts={posts}
      BannerComponent={BannerOrganismos}
    />
  );
}

export const revalidate = 1800;
