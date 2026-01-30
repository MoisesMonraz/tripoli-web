import { getArticlesBySubcategory } from "../../../../lib/contentful";
import SubcategoryListPageClient from "../../../../components/category/SubcategoryListPageClient";
import BannerInstituciones from "../../../../components/instituciones-de-salud/bannerheader";

export default async function InstitucionesDeSaludPage() {
  const posts = await getArticlesBySubcategory("sector-salud", "instituciones-de-salud", 50);

  return (
    <SubcategoryListPageClient
      titleEs="Instituciones de Salud" title="Healthcare Institutions"
      categorySlug="sector-salud"
      subcategorySlug="instituciones-de-salud"
      barColor="#e6007e"
      gradientMid="#f29fc5"
      gradientFrom="#f9d3e6"
      initialPosts={posts}
      BannerComponent={BannerInstituciones}
    />
  );
}

export const revalidate = 1800;
