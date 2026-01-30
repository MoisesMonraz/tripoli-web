import { getArticlesBySubcategory } from "../../../lib/contentful";
import PoliticaClient from "./PoliticaClient";

export const metadata = {
  title: "Política y Leyes | Tripoli Media",
  description: "Noticias y artículos sobre política, leyes, organismos públicos, administración estatal y servicios jurídicos.",
};

export default async function PoliticaYLeyesPage() {
  const [organismosData, administracionData, juridicosData] = await Promise.all([
    getArticlesBySubcategory("politica-y-leyes", "organismos-publicos", 6),
    getArticlesBySubcategory("politica-y-leyes", "administracion-estatal-local", 6),
    getArticlesBySubcategory("politica-y-leyes", "servicios-juridicos", 6),
  ]);

  return (
    <PoliticaClient
      organismosData={organismosData}
      administracionData={administracionData}
      juridicosData={juridicosData}
    />
  );
}

export const revalidate = 1800;
