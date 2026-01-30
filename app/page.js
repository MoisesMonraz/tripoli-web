import CategorySection from "../components/home/CategorySection";
import BannerHeader from "../components/BannerHeader";
import BannerEntretenimientoCultura from "../components/home/BannerEntretenimientoCultura";
import BannerSectorsalud from "../components/home/BannerSectorsalud";
import BannerIndustriaTI from "../components/home/BannerIndustriaTI";
import BannerInfraestructuraSociaI from "../components/home/BannerInfraestructuraSociaI";
import BannerPoliticaLeyes from "../components/home/BannerPoliticaLeyes";
import StructuredData from "../components/seo/StructuredData";
import { getArticlesByCategory } from "../lib/contentful";

export default async function HomePage() {
  // Fetch articles for each category in parallel
  const [
    consumoArticles,
    entretenimientoArticles,
    industriaTIArticles,
    infraestructuraArticles,
    politicaArticles,
    saludArticles,
  ] = await Promise.all([
    getArticlesByCategory('consumo-y-retail', 6),
    getArticlesByCategory('entretenimiento-y-cultura', 6),
    getArticlesByCategory('industria-ti', 6),
    getArticlesByCategory('infraestructura-social', 6),
    getArticlesByCategory('politica-y-leyes', 6),
    getArticlesByCategory('sector-salud', 6),
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
          posts={consumoArticles}
          barColor="#f39200"
          barLightColor="#fee5c8"
          barPulseDuration="8s"
          barMoveDuration="8s"
        />

        <CategorySection
          title="Entretenimiento y Cultura"
          titleEn="Entertainment & Culture"
          slug="entretenimiento-y-cultura"
          posts={entretenimientoArticles}
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
          posts={industriaTIArticles}
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
          posts={infraestructuraArticles}
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
          posts={politicaArticles}
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
          posts={saludArticles}
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

// ISR: Revalidate every 30 minutes
export const revalidate = 1800;
