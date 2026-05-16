import { getArticlesBySubcategory } from "../../../../lib/contentful";
import { getRevistasBySubcategory, revistaToPost } from "../../../../lib/revistas";
import SubcategoryListPageClient from "../../../../components/category/SubcategoryListPageClient";
import BannerOrganismos from "../../../../components/organismos-publicos/bannerheader";

export default async function OrganismosPublicosPage() {
  const [articlePosts, revistaItems] = await Promise.all([
    getArticlesBySubcategory("politica-y-leyes", "organismos-publicos", 50),
    getRevistasBySubcategory("organismos-publicos"),
  ]);
  const posts = [...articlePosts, ...revistaItems.map(revistaToPost)].sort(
    (a, b) => new Date(b.dateISO || 0).getTime() - new Date(a.dateISO || 0).getTime()
  );

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

export const revalidate = 3600;
