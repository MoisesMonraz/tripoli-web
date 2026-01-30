import { getArticlesBySubcategory } from "../../../lib/contentful";
import IndustriaTIClient from "./IndustriaTIClient";

export const metadata = {
  title: "Industria TI | Tripoli Media",
  description: "Noticias y artículos sobre la industria de tecnologías de información, fabricantes, mayoristas y canales de distribución.",
};

export default async function IndustriaTIPage() {
  const [fabricantesData, mayoristasData, canalesData] = await Promise.all([
    getArticlesBySubcategory("industria-ti", "fabricantes-de-tecnologia", 6),
    getArticlesBySubcategory("industria-ti", "mayoristas-ti", 6),
    getArticlesBySubcategory("industria-ti", "canales-de-distribucion", 6),
  ]);

  return (
    <IndustriaTIClient
      fabricantesData={fabricantesData}
      mayoristasData={mayoristasData}
      canalesData={canalesData}
    />
  );
}

export const revalidate = 1800;
