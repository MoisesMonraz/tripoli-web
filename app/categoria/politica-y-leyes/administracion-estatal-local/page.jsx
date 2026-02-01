import { getArticlesBySubcategory } from "../../../../lib/contentful";
import SubcategoryListPageClient from "../../../../components/category/SubcategoryListPageClient";
import BannerAdministracion from "../../../../components/administracion-estatal-local/bannerheader";

export default async function AdministracionEstatalLocalPage() {
  const posts = await getArticlesBySubcategory("politica-y-leyes", "administracion-estatal-local", 50);

  return (
    <SubcategoryListPageClient
      titleEs="Administración Pública" title="State and Local Administration"
      categorySlug="politica-y-leyes"
      subcategorySlug="administracion-estatal-local"
      barColor="#312783"
      gradientMid="#9185be"
      gradientFrom="#c8c1e1"
      initialPosts={posts}
      BannerComponent={BannerAdministracion}
    />
  );
}

export const revalidate = 1800;
