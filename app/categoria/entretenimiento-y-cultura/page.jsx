import { getArticlesBySubcategory } from "../../../lib/contentful";
import EntretenimientoClient from "./EntretenimientoClient";

export const metadata = {
  title: "Entretenimiento y Cultura | Tripoli Media",
  description: "Noticias y artículos sobre entretenimiento, cultura, productoras de contenido, promotores culturales, festivales y eventos.",
};

export default async function EntretenimientoCulturaPage() {
  const [productorasData, recintosData, festivalesData] = await Promise.all([
    getArticlesBySubcategory("entretenimiento-y-cultura", "productoras-de-contenido", 6),
    getArticlesBySubcategory("entretenimiento-y-cultura", "promotores-culturales", 6),
    getArticlesBySubcategory("entretenimiento-y-cultura", "festivales-eventos-y-artistas", 6),
  ]);

  return (
    <EntretenimientoClient
      productorasData={productorasData}
      recintosData={recintosData}
      festivalesData={festivalesData}
    />
  );
}

export const revalidate = 1800;
