import { getArticlesBySubcategory } from "../../../../lib/contentful";
import SubcategoryListPageClient from "../../../../components/category/SubcategoryListPageClient";
import BannerMateriales from "../../../../components/proveedores-de-materiales/bannerheader";

export default async function ProveedoresDeMaterialesPage() {
  const posts = await getArticlesBySubcategory("infraestructura-social", "proveedores-de-materiales", 50);

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

export const revalidate = 1800;
