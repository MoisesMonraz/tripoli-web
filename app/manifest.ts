import { MetadataRoute } from 'next';

/**
 * Web App Manifest para Tripoli Media
 *
 * Define cómo se comporta la aplicación cuando se instala como PWA (Progressive Web App).
 * Esto mejora la experiencia en dispositivos móviles y permite instalación en pantalla de inicio.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest
 * @see https://developer.mozilla.org/en-US/docs/Web/Manifest
 */

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tripoli Media - Plataforma de Medios Profesionales',
    short_name: 'Tripoli Media',
    description:
      'Plataforma profesional de noticias y análisis para agencias. Cobertura especializada en Consumo, Entretenimiento, TI, Infraestructura, Política y Salud.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#312783', // Color púrpura principal de Política y Leyes
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'es-MX',
    dir: 'ltr',
    categories: ['news', 'business', 'productivity'],
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    screenshots: [
      {
        src: '/screenshot-desktop.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Tripoli Media Desktop View',
      },
      {
        src: '/screenshot-mobile.png',
        sizes: '750x1334',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Tripoli Media Mobile View',
      },
    ],
    shortcuts: [
      {
        name: 'Servicios',
        short_name: 'Servicios',
        description: 'Ver servicios de Tripoli Media',
        url: '/servicios',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Contacto',
        short_name: 'Contacto',
        description: 'Contactar con Tripoli Media',
        url: '/contacto',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
    ],
    prefer_related_applications: false,
  };
}
