import { getArticlesBySubcategory } from "../../../../lib/contentful";
import SubcategoryListPageClient from "../../../../components/category/SubcategoryListPageClient";
import BannerFestivales from "../../../../components/festivales-eventos-y-artistas/bannerheader";

export default async function FestivalesEventosArtistasPage() {
    const posts = await getArticlesBySubcategory("entretenimiento-y-cultura", "festivales-eventos-y-artistas", 50);

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

export const revalidate = 1800;
