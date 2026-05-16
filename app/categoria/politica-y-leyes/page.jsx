import { getArticlesBySubcategory } from "../../../lib/contentful";
import { getRevistasByCategory } from "../../../lib/revistas";
import PoliticaClient from "./PoliticaClient";

export const metadata = {
  title: "Política y Leyes | Tripoli Media",
  description: "Noticias y artículos sobre política, leyes, organismos públicos, administración estatal y servicios jurídicos.",
};

export default async function PoliticaYLeyesPage() {
  const [organismosData, administracionData, juridicosData, revistas] = await Promise.all([
    getArticlesBySubcategory("politica-y-leyes", "organismos-publicos", 6),
    getArticlesBySubcategory("politica-y-leyes", "administracion-publica", 6),
    getArticlesBySubcategory("politica-y-leyes", "servicios-juridicos", 6),
    getRevistasByCategory("politica-y-leyes"),
  ]);

  return (
    <PoliticaClient
      organismosData={organismosData}
      administracionData={administracionData}
      juridicosData={juridicosData}
      revistas={revistas}
    />
  );
}

export const revalidate = 60;
