import { getArticlesBySubcategory } from "../../../../lib/contentful";
import { getRevistasBySubcategory, revistaToPost } from "../../../../lib/revistas";
import SubcategoryListPageClient from "../../../../components/category/SubcategoryListPageClient";
import BannerMayoristas from "../../../../components/mayoristas-ti/bannerheader";

export default async function MayoristasTiPage() {
  const [articlePosts, revistaItems] = await Promise.all([
    getArticlesBySubcategory("industria-ti", "mayoristas-ti", 50),
    getRevistasBySubcategory("mayoristas-ti"),
  ]);
  const posts = [...articlePosts, ...revistaItems.map(revistaToPost)].sort(
    (a, b) => new Date(b.dateISO || 0).getTime() - new Date(a.dateISO || 0).getTime()
  );

  return (
    <SubcategoryListPageClient
      titleEs="Mayoristas TI" title="IT Wholesalers"
      categorySlug="industria-ti"
      subcategorySlug="mayoristas-ti"
      barColor="#0069b4"
      gradientFrom="#c8d5ef"
      initialPosts={posts}
      BannerComponent={BannerMayoristas}
    />
  );
}

export const revalidate = 3600;
