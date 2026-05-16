import { getArticlesBySubcategory } from "../../../../lib/contentful";
import { getRevistasBySubcategory, revistaToPost } from "../../../../lib/revistas";
import SubcategoryListPageClient from "../../../../components/category/SubcategoryListPageClient";
import BannerFabricantes from "../../../../components/fabricantes-y-proveedores/bannerheader";

export default async function FabricantesYProveedoresPage() {
  const [articlePosts, revistaItems] = await Promise.all([
    getArticlesBySubcategory("consumo-y-retail", "fabricantes-y-proveedores", 50),
    getRevistasBySubcategory("fabricantes-y-proveedores"),
  ]);
  const posts = [...articlePosts, ...revistaItems.map(revistaToPost)].sort(
    (a, b) => new Date(b.dateISO || 0).getTime() - new Date(a.dateISO || 0).getTime()
  );

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

export const revalidate = 3600;
