import { getArticlesBySubcategory } from "../../../../lib/contentful";
import SubcategoryListPageClient from "../../../../components/category/SubcategoryListPageClient";
import BannerProductoras from "../../../../components/productoras-de-contenido/bannerheader";

export default async function ProductorasDeContenidoPage() {
  const posts = await getArticlesBySubcategory("entretenimiento-y-cultura", "productoras-de-contenido", 50);

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

export const revalidate = 1800;
