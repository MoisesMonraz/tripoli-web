import { MetadataRoute } from 'next';

/**
 * Robots.txt para Tripoli Media
 *
 * Configuración optimizada para SEO que permite el rastreo completo del sitio
 * mientras protege rutas sensibles.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */

export default function robots(): MetadataRoute.Robots {
  const SITE_URL = 'https://tripolimedia.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/*',           // Bloquear endpoints de API
          '/_next/*',         // Bloquear archivos internos de Next.js
          '/private/*',       // Bloquear rutas privadas (si existen)
        ],
      },
      // Reglas específicas para bots comunes
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/*', '/_next/*'],
        crawlDelay: 0,
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/api/*', '/_next/*'],
        crawlDelay: 0,
      },
      // Bloquear bots maliciosos conocidos
      {
        userAgent: [
          'AhrefsBot',
          'SemrushBot',
          'DotBot',
          'MJ12bot',
        ],
        disallow: '/',
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
