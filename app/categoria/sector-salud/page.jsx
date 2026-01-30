import { getArticlesBySubcategory } from "../../../lib/contentful";
import SaludClient from "./SaludClient";

export const metadata = {
  title: "Sector Salud | Tripoli Media",
  description: "Noticias y artículos sobre el sector salud, fabricantes de equipos e insumos, instituciones de salud y especialistas médicos.",
};

export default async function SectorSaludPage() {
  const [fabricantesData, institucionesData, especialistasData] = await Promise.all([
    getArticlesBySubcategory("sector-salud", "fabricantes-equipo-insumos", 6),
    getArticlesBySubcategory("sector-salud", "instituciones-de-salud", 6),
    getArticlesBySubcategory("sector-salud", "especialistas-medicos", 6),
  ]);

  return (
    <SaludClient
      fabricantesData={fabricantesData}
      institucionesData={institucionesData}
      especialistasData={especialistasData}
    />
  );
}

export const revalidate = 1800;
