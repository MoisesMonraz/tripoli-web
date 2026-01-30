import { getArticlesBySubcategory } from "../../../../lib/contentful";
import SubcategoryListPageClient from "../../../../components/category/SubcategoryListPageClient";
import BannerDesarrolladores from "../../../../components/desarrolladores-de-proyectos/bannerheader";

export default async function DesarrolladoresDeProyectosPage() {
  const posts = await getArticlesBySubcategory("infraestructura-social", "desarrolladores-de-proyectos", 50);

  return (
    <SubcategoryListPageClient
      titleEs="Desarrolladores de Proyectos" title="Project Developers"
      categorySlug="infraestructura-social"
      subcategorySlug="desarrolladores-de-proyectos"
      barColor="#5d514c"
      gradientMid="#958b87"
      gradientFrom="#d8d4d3"
      initialPosts={posts}
      BannerComponent={BannerDesarrolladores}
    />
  );
}

export const revalidate = 1800;
