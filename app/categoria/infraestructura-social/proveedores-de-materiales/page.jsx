import { getArticlesBySubcategory } from "../../../../lib/contentful";
import { getRevistasBySubcategory, revistaToPost } from "../../../../lib/revistas";
import SubcategoryListPageClient from "../../../../components/category/SubcategoryListPageClient";
import BannerMateriales from "../../../../components/proveedores-de-materiales/bannerheader";

export default async function ProveedoresDeMaterialesPage() {
  const [articlePosts, revistaItems] = await Promise.all([
    getArticlesBySubcategory("infraestructura-social", "proveedores-de-materiales", 50),
    getRevistasBySubcategory("proveedores-de-materiales"),
  ]);
  const posts = [...articlePosts, ...revistaItems.map(revistaToPost)].sort(
    (a, b) => new Date(b.dateISO || 0).getTime() - new Date(a.dateISO || 0).getTime()
  );

  return (
    <SubcategoryListPageClient
      titleEs="Proveedores de Materiales" title="Materials Suppliers"
      categorySlug="infraestructura-social"
      subcategorySlug="proveedores-de-materiales"
      barColor="#5d514c"
      gradientMid="#958b87"
      gradientFrom="#d8d4d3"
      initialPosts={posts}
      BannerComponent={BannerMateriales}
    />
  );
}

export const revalidate = 3600;
