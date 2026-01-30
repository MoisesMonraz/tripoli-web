import { getArticlesBySubcategory } from "../../../../lib/contentful";
import SubcategoryListPageClient from "../../../../components/category/SubcategoryListPageClient";
import BannerEspecialistas from "../../../../components/especialistas-medicos/bannerheader";

export default async function EspecialistasMedicosPage() {
  const posts = await getArticlesBySubcategory("sector-salud", "especialistas-medicos", 50);

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

export const revalidate = 1800;
