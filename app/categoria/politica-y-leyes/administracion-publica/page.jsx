import { getArticlesBySubcategory } from "../../../../lib/contentful";
import { getRevistasBySubcategory, revistaToPost } from "../../../../lib/revistas";
import SubcategoryListPageClient from "../../../../components/category/SubcategoryListPageClient";
import BannerAdministracion from "../../../../components/administracion-publica/bannerheader";

export default async function AdministracionPublicaPage() {
  const [articlePosts, revistaItems] = await Promise.all([
    getArticlesBySubcategory("politica-y-leyes", "administracion-publica", 50),
    getRevistasBySubcategory("administracion-publica"),
  ]);
  const posts = [...articlePosts, ...revistaItems.map(revistaToPost)].sort(
    (a, b) => new Date(b.dateISO || 0).getTime() - new Date(a.dateISO || 0).getTime()
  );

  return (
    <SubcategoryListPageClient
      titleEs="Administración Pública" title="Public Administration"
      categorySlug="politica-y-leyes"
      subcategorySlug="administracion-publica"
      barColor="#312783"
      gradientMid="#9185be"
      gradientFrom="#c8c1e1"
      initialPosts={posts}
      BannerComponent={BannerAdministracion}
    />
  );
}

export const revalidate = 3600;
