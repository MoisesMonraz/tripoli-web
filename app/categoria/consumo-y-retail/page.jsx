import { getArticlesBySubcategory } from "../../../lib/contentful";
import ConsumoRetailClient from "./ConsumoRetailClient";

export const metadata = {
  title: "Consumo y Retail | Tripoli Media",
  description: "Noticias y artículos sobre consumo, retail, fabricantes, proveedores, cadenas comerciales y negocios de conveniencia.",
};

export default async function ConsumoRetailPage() {
  const [fabricantesData, cadenasData, convenienciaData] = await Promise.all([
    getArticlesBySubcategory("consumo-y-retail", "fabricantes-y-proveedores", 6),
    getArticlesBySubcategory("consumo-y-retail", "cadenas-comerciales", 6),
    getArticlesBySubcategory("consumo-y-retail", "negocios-de-conveniencia", 6),
  ]);

  return (
    <ConsumoRetailClient
      fabricantesData={fabricantesData}
      cadenasData={cadenasData}
      convenienciaData={convenienciaData}
    />
  );
}

export const revalidate = 1800;
