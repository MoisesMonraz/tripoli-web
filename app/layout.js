import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { LanguageProvider } from "../components/LanguageProvider";
import ScrollToTop from "../components/ScrollToTop";
import AIChatWidget from "../components/ai/AIChatWidget";
import AccessGateModal from "../components/AccessGateModal";

/**
 * Metadata global para Tripoli Media
 *
 * Define metainformación SEO, Open Graph, Twitter Cards, y más.
 * Esta metadata se hereda en todas las páginas a menos que se sobreescriba.
 */
export const metadata = {
  metadataBase: new URL('https://tripolimedia.com'),
  title: {
    default: 'Tripoli Media - Plataforma de Medios Profesionales',
    template: '%s | Tripoli Media',
  },
  description:
    'Plataforma profesional de noticias y análisis para agencias. Cobertura especializada en Consumo y Retail, Entretenimiento y Cultura, Industria TI, Infraestructura Social, Política y Leyes, y Sector Salud.',
  keywords: [
    'noticias empresariales',
    'medios profesionales',
    'análisis sectorial',
    'consumo y retail',
    'entretenimiento',
    'tecnología',
    'infraestructura',
    'política',
    'salud',
    'agencias de medios',
    'contenido editorial',
    'análisis de datos',
  ],
  authors: [{ name: 'Tripoli Media' }],
  creator: 'Tripoli Media',
  publisher: 'Tripoli Media',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    url: 'https://tripolimedia.com',
    siteName: 'Tripoli Media',
    title: 'Tripoli Media - Plataforma de Medios Profesionales',
    description:
      'Cobertura especializada en 6 sectores clave: Consumo, Entretenimiento, TI, Infraestructura, Política y Salud.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Tripoli Media - Plataforma de Medios Profesionales',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tripoli Media - Plataforma de Medios Profesionales',
    description:
      'Cobertura especializada en 6 sectores clave: Consumo, Entretenimiento, TI, Infraestructura, Política y Salud.',
    images: ['/twitter-image'],
    creator: '@tripolimedia',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    title: 'Tripoli',
    statusBarStyle: 'default',
  },
  alternates: {
    canonical: 'https://tripolimedia.com',
    languages: {
      'es-MX': 'https://tripolimedia.com',
      'en-US': 'https://tripolimedia.com/en',
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
  category: 'news',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-white text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-50">
        <LanguageProvider>
          <ScrollToTop />
          <Header />
          {children}
          <Footer />
          <AccessGateModal />
          <AIChatWidget />
        </LanguageProvider>
      </body>
    </html>
  );
}
