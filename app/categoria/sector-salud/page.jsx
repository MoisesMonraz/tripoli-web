import { getArticlesBySubcategory } from "../../../lib/contentful";
import { getRevistasByCategory } from "../../../lib/revistas";
import SaludClient from "./SaludClient";

export const metadata = {
  title: "Sector Salud | Tripoli Media",
  description: "Noticias y artículos sobre el sector salud, fabricantes de equipos e insumos, instituciones de salud y especialistas médicos.",
};

export default async function SectorSaludPage() {
  const [fabricantesData, institucionesData, especialistasData, revistas] = await Promise.all([
    getArticlesBySubcategory("sector-salud", "fabricantes-equipos-insumos", 6),
    getArticlesBySubcategory("sector-salud", "instituciones-de-salud", 6),
    getArticlesBySubcategory("sector-salud", "especialistas-medicos", 6),
    getRevistasByCategory("sector-salud"),
  ]);

  return (
    <SaludClient
      fabricantesData={fabricantesData}
      institucionesData={institucionesData}
      especialistasData={especialistasData}
      revistas={revistas}
    />
  );
}

export const revalidate = 60;
