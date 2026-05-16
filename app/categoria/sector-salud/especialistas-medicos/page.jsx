import { getArticlesBySubcategory } from "../../../../lib/contentful";
import { getRevistasBySubcategory, revistaToPost } from "../../../../lib/revistas";
import SubcategoryListPageClient from "../../../../components/category/SubcategoryListPageClient";
import BannerEspecialistas from "../../../../components/especialistas-medicos/bannerheader";

export default async function EspecialistasMedicosPage() {
  const [articlePosts, revistaItems] = await Promise.all([
    getArticlesBySubcategory("sector-salud", "especialistas-medicos", 50),
    getRevistasBySubcategory("especialistas-medicos"),
  ]);
  const posts = [...articlePosts, ...revistaItems.map(revistaToPost)].sort(
    (a, b) => new Date(b.dateISO || 0).getTime() - new Date(a.dateISO || 0).getTime()
  );

  return (
    <SubcategoryListPageClient
      titleEs="Especialistas Médicos" title="Medical Specialists"
      categorySlug="sector-salud"
      subcategorySlug="especialistas-medicos"
      barColor="#e6007e"
      gradientMid="#f29fc5"
      gradientFrom="#f9d3e6"
      initialPosts={posts}
      BannerComponent={BannerEspecialistas}
    />
  );
}

export const revalidate = 3600;
