import { getArticlesBySubcategory } from "../../../../lib/contentful";
import SubcategoryListPageClient from "../../../../components/category/SubcategoryListPageClient";
import BannerAdministracion from "../../../../components/administracion-publica/bannerheader";

export default async function AdministracionPublicaPage() {
  const posts = await getArticlesBySubcategory("politica-y-leyes", "administracion-publica", 50);

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

export const revalidate = 1800;
