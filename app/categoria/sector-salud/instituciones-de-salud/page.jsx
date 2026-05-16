import { getArticlesBySubcategory } from "../../../../lib/contentful";
import { getRevistasBySubcategory, revistaToPost } from "../../../../lib/revistas";
import SubcategoryListPageClient from "../../../../components/category/SubcategoryListPageClient";
import BannerInstituciones from "../../../../components/instituciones-de-salud/bannerheader";

export default async function InstitucionesDeSaludPage() {
  const [articlePosts, revistaItems] = await Promise.all([
    getArticlesBySubcategory("sector-salud", "instituciones-de-salud", 50),
    getRevistasBySubcategory("instituciones-de-salud"),
  ]);
  const posts = [...articlePosts, ...revistaItems.map(revistaToPost)].sort(
    (a, b) => new Date(b.dateISO || 0).getTime() - new Date(a.dateISO || 0).getTime()
  );

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

export const revalidate = 3600;
