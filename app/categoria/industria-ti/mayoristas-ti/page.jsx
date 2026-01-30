import { getArticlesBySubcategory } from "../../../../lib/contentful";
import SubcategoryListPageClient from "../../../../components/category/SubcategoryListPageClient";
import BannerMayoristas from "../../../../components/mayoristas-ti/bannerheader";

export default async function MayoristasTiPage() {
  const posts = await getArticlesBySubcategory("industria-ti", "mayoristas-ti", 50);

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

export const revalidate = 1800;
