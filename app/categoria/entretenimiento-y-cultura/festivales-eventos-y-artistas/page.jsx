import { getArticlesBySubcategory } from "../../../../lib/contentful";
import { getRevistasBySubcategory, revistaToPost } from "../../../../lib/revistas";
import SubcategoryListPageClient from "../../../../components/category/SubcategoryListPageClient";
import BannerFestivales from "../../../../components/festivales-eventos-y-artistas/bannerheader";

export default async function FestivalesEventosArtistasPage() {
    const [articlePosts, revistaItems] = await Promise.all([
      getArticlesBySubcategory("entretenimiento-y-cultura", "festivales-eventos-y-artistas", 50),
      getRevistasBySubcategory("festivales-eventos-y-artistas"),
    ]);
    const posts = [...articlePosts, ...revistaItems.map(revistaToPost)].sort(
      (a, b) => new Date(b.dateISO || 0).getTime() - new Date(a.dateISO || 0).getTime()
    );

    return (
        <SubcategoryListPageClient
            titleEs="Festivales, Eventos y Artistas" title="Festivals, Events and Artists"
            categorySlug="entretenimiento-y-cultura"
            subcategorySlug="festivales-eventos-y-artistas"
            barColor="#009640"
            gradientFrom="#cce5ce"
            initialPosts={posts}
            BannerComponent={BannerFestivales}
        />
    );
}

export const revalidate = 3600;
