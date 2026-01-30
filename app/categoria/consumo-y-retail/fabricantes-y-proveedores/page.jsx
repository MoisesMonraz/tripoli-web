import { getArticlesBySubcategory } from "../../../../lib/contentful";
import SubcategoryListPageClient from "../../../../components/category/SubcategoryListPageClient";
import BannerFabricantes from "../../../../components/fabricantes-y-proveedores/bannerheader";

export default async function FabricantesYProveedoresPage() {
  const posts = await getArticlesBySubcategory("consumo-y-retail", "fabricantes-y-proveedores", 50);

  return (
    <SubcategoryListPageClient
      titleEs="Fabricantes y Proveedores" title="Manufacturers and Suppliers"
      categorySlug="consumo-y-retail"
      subcategorySlug="fabricantes-y-proveedores"
      barColor="#f39200"
      gradientFrom="#fee5c8"
      gradientMid="#fdc652"
      initialPosts={posts}
      BannerComponent={BannerFabricantes}
    />
  );
}

export const revalidate = 1800;
