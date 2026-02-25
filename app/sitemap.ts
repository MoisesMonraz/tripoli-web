import { MetadataRoute } from 'next';
import { getLatestArticles } from '../lib/contentful';

/**
 * Sitemap dinámico para Tripoli Media
 *
 * Este sitemap incluye todas las rutas estáticas y dinámicas del sitio,
 * incluyendo artículos obtenidos dinámicamente desde Contentful.
 * Next.js 14 generará automáticamente el archivo sitemap.xml en la raíz del dominio.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */

const SITE_URL = 'https://www.tripoli.media';

/**
 * Categorías principales y sus subcategorías
 */
const CATEGORIES = [
  {
    slug: 'consumo-y-retail',
    subcategories: [
      'fabricantes-y-proveedores',
      'cadenas-comerciales',
      'negocios-de-conveniencia',
    ],
  },
  {
    slug: 'entretenimiento-y-cultura',
    subcategories: [
      'productoras-de-contenido',
      'promotores-culturales',
      'festivales-eventos-y-artistas',
    ],
  },
  {
    slug: 'industria-ti',
    subcategories: [
      'fabricantes-de-tecnologia',
      'mayoristas-ti',
      'canales-de-distribucion',
    ],
  },
  {
    slug: 'infraestructura-social',
    subcategories: [
      'proveedores-de-materiales',
      'desarrolladores-de-proyectos',
      'promotores-inmobiliarios',
    ],
  },
  {
    slug: 'politica-y-leyes',
    subcategories: [
      'organismos-publicos',
      'administracion-estatal-y-local',
      'servicios-juridicos',
    ],
  },
  {
    slug: 'sector-salud',
    subcategories: [
      'fabricantes-de-equipo-e-insumos',
      'instituciones-de-salud',
      'especialistas-medicos',
    ],
  },
];

/**
 * Rutas estáticas del sitio
 */
const STATIC_ROUTES = [
  { url: '', changeFrequency: 'daily' as const, priority: 1.0 },
  { url: '/servicios', changeFrequency: 'weekly' as const, priority: 0.9 },
  { url: '/conocenos', changeFrequency: 'monthly' as const, priority: 0.8 },
  { url: '/contacto', changeFrequency: 'monthly' as const, priority: 0.9 },
  { url: '/calendario', changeFrequency: 'weekly' as const, priority: 0.7 },
  { url: '/aviso-de-privacidad', changeFrequency: 'yearly' as const, priority: 0.3 },
  { url: '/terminos-y-condiciones', changeFrequency: 'yearly' as const, priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const currentDate = new Date();

  // Obtener todos los artículos publicados desde Contentful
  const articles = await getLatestArticles(1000);

  // Rutas estáticas
  const staticRoutes: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.url}`,
    lastModified: currentDate,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  // Rutas de categorías principales
  const categoryRoutes: MetadataRoute.Sitemap = CATEGORIES.map((category) => ({
    url: `${SITE_URL}/categoria/${category.slug}`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Rutas de subcategorías
  const subcategoryRoutes: MetadataRoute.Sitemap = CATEGORIES.flatMap((category) =>
    category.subcategories.map((subcategory) => ({
      url: `${SITE_URL}/categoria/${category.slug}/${subcategory}`,
      lastModified: currentDate,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }))
  );

  // Rutas de artículos individuales
  const articleRoutes: MetadataRoute.Sitemap = articles
    .filter((a: any) => a.category && a.subcategory && a.slug)
    .map((article: any) => ({
      url: `${SITE_URL}/${article.category}/${article.subcategory}/articulo/${article.slug}`,
      lastModified: article.dateISO ? new Date(article.dateISO) : currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

  return [...staticRoutes, ...categoryRoutes, ...subcategoryRoutes, ...articleRoutes];
}
