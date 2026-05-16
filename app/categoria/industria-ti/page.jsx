import { getArticlesBySubcategory } from "../../../lib/contentful";
import { getRevistasByCategory } from "../../../lib/revistas";
import IndustriaTIClient from "./IndustriaTIClient";

export const metadata = {
  title: "Industria TI | Tripoli Media",
  description: "Noticias y artículos sobre la industria de tecnologías de información, fabricantes, mayoristas y canales de distribución.",
};

export default async function IndustriaTIPage() {
  const [fabricantesData, mayoristasData, canalesData, revistas] = await Promise.all([
    getArticlesBySubcategory("industria-ti", "fabricantes-de-tecnologia", 6),
    getArticlesBySubcategory("industria-ti", "mayoristas-ti", 6),
    getArticlesBySubcategory("industria-ti", "canales-de-distribucion", 6),
    getRevistasByCategory("industria-ti"),
  ]);

  return (
    <IndustriaTIClient
      fabricantesData={fabricantesData}
      mayoristasData={mayoristasData}
      canalesData={canalesData}
      revistas={revistas}
    />
  );
}

export const revalidate = 60;
