import { getArticlesBySubcategory } from "../../../lib/contentful";
import { getRevistasByCategory } from "../../../lib/revistas";
import ConsumoRetailClient from "./ConsumoRetailClient";

export const metadata = {
  title: "Consumo y Retail | Tripoli Media",
  description: "Noticias y artículos sobre consumo, retail, fabricantes, proveedores, cadenas comerciales y negocios de conveniencia.",
};

export default async function ConsumoRetailPage() {
  const [fabricantesData, cadenasData, convenienciaData, revistas] = await Promise.all([
    getArticlesBySubcategory("consumo-y-retail", "fabricantes-y-proveedores", 6),
    getArticlesBySubcategory("consumo-y-retail", "cadenas-comerciales", 6),
    getArticlesBySubcategory("consumo-y-retail", "negocios-de-conveniencia", 6),
    getRevistasByCategory("consumo-y-retail"),
  ]);

  return (
    <ConsumoRetailClient
      fabricantesData={fabricantesData}
      cadenasData={cadenasData}
      convenienciaData={convenienciaData}
      revistas={revistas}
    />
  );
}

export const revalidate = 3600;
