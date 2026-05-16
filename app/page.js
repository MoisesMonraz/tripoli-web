import CategorySection from "../components/home/CategorySection";
import BannerHeader from "../components/BannerHeader";
import BannerEntretenimientoCultura from "../components/home/BannerEntretenimientoCultura";
import BannerSectorsalud from "../components/home/BannerSectorsalud";
import BannerIndustriaTI from "../components/home/BannerIndustriaTI";
import BannerInfraestructuraSociaI from "../components/home/BannerInfraestructuraSociaI";
import BannerPoliticaLeyes from "../components/home/BannerPoliticaLeyes";
import StructuredData from "../components/seo/StructuredData";
import { getArticlesByCategory } from "../lib/contentful";
import { getRevistas, revistaToPost } from "../lib/revistas";

function mergeWithRevistas(articles, revistas, catSlug) {
  const revistaPosts = revistas
    .filter((r) => r.categoria.slug === catSlug)
    .map(revistaToPost);
  return [...articles, ...revistaPosts].sort(
    (a, b) => new Date(b.dateISO || b.date || 0).getTime() - new Date(a.dateISO || a.date || 0).getTime()
  );
}

export default async function HomePage() {
  const [
    consumoArticles,
    entretenimientoArticles,
    industriaTIArticles,
    infraestructuraArticles,
    politicaArticles,
    saludArticles,
    allRevistas,
  ] = await Promise.all([
    getArticlesByCategory('consumo-y-retail', 6),
    getArticlesByCategory('entretenimiento-y-cultura', 6),
    getArticlesByCategory('industria-ti', 6),
    getArticlesByCategory('infraestructura-social', 6),
    getArticlesByCategory('politica-y-leyes', 6),
    getArticlesByCategory('sector-salud', 6),
    getRevistas(),
  ]);

  return (
    <>
      <StructuredData />
      <BannerHeader />
      <main className="flex flex-col gap-7 pb-12 mt-7">
        <CategorySection
          title="Consumo y Retail"
          titleEn="Consumer & Retail"
          slug="consumo-y-retail"
          titleHref="/categoria/consumo-y-retail"
          posts={mergeWithRevistas(consumoArticles, allRevistas, "consumo-y-retail")}
          barColor="#f39200"
          barLightColor="#fee5c8"
          barPulseDuration="8s"
          barMoveDuration="8s"
        />

        <CategorySection
          title="Entretenimiento y Cultura"
          titleEn="Entertainment & Culture"
          slug="entretenimiento-y-cultura"
          posts={mergeWithRevistas(entretenimientoArticles, allRevistas, "entretenimiento-y-cultura")}
          BannerComponent={BannerEntretenimientoCultura}
          barColor="#009640"
          barLightColor="#cce5ce"
          barPulseDuration="8s"
          barMoveDuration="8s"
          titleBgColor="#009640"
          titleHoverBgColor="#007a33"
          titleTextColor="#cce5ce"
        />

        <CategorySection
          title="Industria TI"
          titleEn="Industry IT"
          slug="industria-ti"
          posts={mergeWithRevistas(industriaTIArticles, allRevistas, "industria-ti")}
          BannerComponent={BannerIndustriaTI}
          barColor="#0069b4"
          barLightColor="#c8d5ef"
          barPulseDuration="8s"
          barMoveDuration="8s"
          titleBgColor="#0069b4"
          titleHoverBgColor="#004070"
          titleTextColor="#c8d5ef"
        />

        <CategorySection
          title="Infraestructura Social"
          titleEn="Social Infrastructure"
          slug="infraestructura-social"
          posts={mergeWithRevistas(infraestructuraArticles, allRevistas, "infraestructura-social")}
          BannerComponent={BannerInfraestructuraSociaI}
          barColor="#5d514c"
          barLightColor="#d8d4d3"
          barPulseDuration="8s"
          barMoveDuration="8s"
          titleBgColor="#5d514c"
          titleHoverBgColor="#3a332f"
          titleTextColor="#d8d4d3"
        />

        <CategorySection
          title="Política y Leyes"
          titleEn="Politics & Law"
          slug="politica-y-leyes"
          posts={mergeWithRevistas(politicaArticles, allRevistas, "politica-y-leyes")}
          BannerComponent={BannerPoliticaLeyes}
          barColor="#312783"
          barLightColor="#c8c1e1"
          barPulseDuration="8s"
          barMoveDuration="8s"
          titleBgColor="#312783"
          titleHoverBgColor="#211452"
          titleTextColor="#c8c1e1"
        />

        <CategorySection
          title="Sector Salud"
          titleEn="Health Sector"
          slug="sector-salud"
          posts={mergeWithRevistas(saludArticles, allRevistas, "sector-salud")}
          BannerComponent={BannerSectorsalud}
          barColor="#e6007e"
          barLightColor="#f9d3e6"
          barPulseDuration="8s"
          barMoveDuration="8s"
          titleBgColor="#e6007e"
          titleHoverBgColor="#8d004c"
          titleTextColor="#f9d3e6"
        />
      </main>
    </>
  );
}

// ISR: Revalidate every hour
export const revalidate = 3600;
// Abort the function after 25s to avoid billing for hung Contentful calls
export const maxDuration = 25;
