import CategorySection from "../../components/home/CategorySection";
import BannerHeader from "../../components/BannerHeader";
import BannerEntretenimientoCultura from "../../components/home/BannerEntretenimientoCultura";
import BannerIndustriaTI from "../../components/home/BannerIndustriaTI";

export default function IndustriaTiPage() {
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
      <main className="flex flex-col gap-12 pb-20">
        <CategorySection title="Consumo y Retail" titleEn="Consumer & Retail" slug="consumo-y-retail" posts={placeholderPosts} />

        <CategorySection
          title="Entretenimiento y Cultura"
          titleEn="Entertainment & Culture"
          slug="entretenimiento-y-cultura"
          posts={placeholderPosts}
          BannerComponent={BannerEntretenimientoCultura}
          barColor="#8ec89a"
          titleBgColor="#009640"
          titleHoverBgColor="#005f27"
          titleTextColor="#cce5ce"
        />

        <CategorySection
          title="Industria TI"
          titleEn="Industry IT"
          slug="industria-ti"
          posts={placeholderPosts}
          BannerComponent={BannerIndustriaTI}
          barColor="#8baddc"
          titleBgColor="#0069b4"
          titleHoverBgColor="#004070"
          titleTextColor="#c8d5ef"
        />
      </main>
    </>
  );
}
