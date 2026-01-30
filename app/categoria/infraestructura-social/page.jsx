import { getArticlesBySubcategory } from "../../../lib/contentful";
import InfraestructuraClient from "./InfraestructuraClient";

export const metadata = {
  title: "Infraestructura Social | Tripoli Media",
  description: "Noticias y artículos sobre infraestructura social, proveedores de materiales, desarrolladores de proyectos y promotores inmobiliarios.",
};

export default async function InfraestructuraSocialPage() {
  const [proveedoresData, desarrolladoresData, promotoresData] = await Promise.all([
    getArticlesBySubcategory("infraestructura-social", "proveedores-de-materiales", 6),
    getArticlesBySubcategory("infraestructura-social", "desarrolladores-de-proyectos", 6),
    getArticlesBySubcategory("infraestructura-social", "promotores-inmobiliarios", 6),
  ]);

  return (
    <InfraestructuraClient
      proveedoresData={proveedoresData}
      desarrolladoresData={desarrolladoresData}
      promotoresData={promotoresData}
    />
  );
}

export const revalidate = 1800;
