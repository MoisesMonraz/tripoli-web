import CategorySection from "../components/home/CategorySection";
import BannerHeader from "../components/BannerHeader";
import BannerEntretenimientoCultura from "../components/home/BannerEntretenimientoCultura";
import BannerSectorsalud from "../components/home/BannerSectorsalud";
import BannerIndustriaTI from "../components/home/BannerIndustriaTI";
import BannerInfraestructuraSociaI from "../components/home/BannerInfraestructuraSociaI";
import BannerPoliticaLeyes from "../components/home/BannerPoliticaLeyes";

export default function HomePage() {
  const placeholderImage =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='200'%3E%3Crect width='100%25' height='100%25' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23718096' font-family='Arial, sans-serif' font-size='16'%3EConsumo%3C/text%3E%3C/svg%3E";

  const placeholderPosts = [
    { title: "Placeholder Title 1", excerpt: "Short preview text here...", date: "November 2025", image: placeholderImage, slug: "placeholder-1" },
    { title: "Placeholder Title 2", excerpt: "Short preview text here...", date: "November 2025", image: placeholderImage, slug: "placeholder-2" },
    { title: "Placeholder Title 3", excerpt: "Short preview text here...", date: "November 2025", image: placeholderImage, slug: "placeholder-3" },
    { title: "Placeholder Title 4", excerpt: "Short preview text here...", date: "November 2025", image: placeholderImage, slug: "placeholder-4" },
    { title: "Placeholder Title 5", excerpt: "Short preview text here...", date: "November 2025", image: placeholderImage, slug: "placeholder-5" },
  ];

  return (
    <>
      <BannerHeader />
      <main className="flex flex-col gap-7 pb-12 mt-7">
        <CategorySection
          title="Consumo y Retail"
          titleEn="Consumer & Retail"
          slug="consumo-y-retail"
          titleHref="/categoria/consumo-y-retail"
          posts={placeholderPosts}
          barColor="#f39200"
          barLightColor="#fee5c8"
          barPulseDuration="8s"
          barMoveDuration="8s"
        />

        <CategorySection
          title="Entretenimiento y Cultura"
          titleEn="Entertainment & Culture"
          slug="entretenimiento-y-cultura"
          posts={placeholderPosts}
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
          posts={placeholderPosts}
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
          posts={placeholderPosts}
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
          posts={placeholderPosts}
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
          posts={placeholderPosts}
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
