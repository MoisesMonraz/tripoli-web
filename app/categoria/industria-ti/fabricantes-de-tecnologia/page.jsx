import { getArticlesBySubcategory } from "../../../../lib/contentful";
import SubcategoryListPageClient from "../../../../components/category/SubcategoryListPageClient";
import BannerFabricantesTec from "../../../../components/fabricantes-de-tecnologia/bannerheader";

export default async function FabricantesDeTecnologiaPage() {
  const posts = await getArticlesBySubcategory("industria-ti", "fabricantes-de-tecnologia", 50);

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

export const revalidate = 1800;
