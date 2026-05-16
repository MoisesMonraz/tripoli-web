import { getArticlesBySubcategory } from "../../../../lib/contentful";
import { getRevistasBySubcategory, revistaToPost } from "../../../../lib/revistas";
import SubcategoryListPageClient from "../../../../components/category/SubcategoryListPageClient";
import BannerDesarrolladores from "../../../../components/desarrolladores-de-proyectos/bannerheader";

export default async function DesarrolladoresDeProyectosPage() {
  const [articlePosts, revistaItems] = await Promise.all([
    getArticlesBySubcategory("infraestructura-social", "desarrolladores-de-proyectos", 50),
    getRevistasBySubcategory("desarrolladores-de-proyectos"),
  ]);
  const posts = [...articlePosts, ...revistaItems.map(revistaToPost)].sort(
    (a, b) => new Date(b.dateISO || 0).getTime() - new Date(a.dateISO || 0).getTime()
  );

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

export const revalidate = 3600;
