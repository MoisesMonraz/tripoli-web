import { getArticlesBySubcategory } from "../../../../lib/contentful";
import { getRevistasBySubcategory, revistaToPost } from "../../../../lib/revistas";
import SubcategoryListPageClient from "../../../../components/category/SubcategoryListPageClient";
import BannerProductoras from "../../../../components/productoras-de-contenido/bannerheader";

export default async function ProductorasDeContenidoPage() {
  const [articlePosts, revistaItems] = await Promise.all([
    getArticlesBySubcategory("entretenimiento-y-cultura", "productoras-de-contenido", 50),
    getRevistasBySubcategory("productoras-de-contenido"),
  ]);
  const posts = [...articlePosts, ...revistaItems.map(revistaToPost)].sort(
    (a, b) => new Date(b.dateISO || 0).getTime() - new Date(a.dateISO || 0).getTime()
  );

  return (
    <SubcategoryListPageClient
      titleEs="Productoras de Contenido" title="Content Producers"
      categorySlug="entretenimiento-y-cultura"
      subcategorySlug="productoras-de-contenido"
      barColor="#009640"
      gradientFrom="#cce5ce"
      initialPosts={posts}
      BannerComponent={BannerProductoras}
    />
  );
}

export const revalidate = 3600;
