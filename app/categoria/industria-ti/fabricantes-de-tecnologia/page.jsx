import { getArticlesBySubcategory } from "../../../../lib/contentful";
import { getRevistasBySubcategory, revistaToPost } from "../../../../lib/revistas";
import SubcategoryListPageClient from "../../../../components/category/SubcategoryListPageClient";
import BannerFabricantesTec from "../../../../components/fabricantes-de-tecnologia/bannerheader";

export default async function FabricantesDeTecnologiaPage() {
  const [articlePosts, revistaItems] = await Promise.all([
    getArticlesBySubcategory("industria-ti", "fabricantes-de-tecnologia", 50),
    getRevistasBySubcategory("fabricantes-de-tecnologia"),
  ]);
  const posts = [...articlePosts, ...revistaItems.map(revistaToPost)].sort(
    (a, b) => new Date(b.dateISO || 0).getTime() - new Date(a.dateISO || 0).getTime()
  );

  return (
    <SubcategoryListPageClient
      titleEs="Fabricantes de Tecnología" title="Technology Manufacturers"
      categorySlug="industria-ti"
      subcategorySlug="fabricantes-de-tecnologia"
      barColor="#0069b4"
      gradientFrom="#c8d5ef"
      initialPosts={posts}
      BannerComponent={BannerFabricantesTec}
    />
  );
}

export const revalidate = 3600;
