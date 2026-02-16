import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";

import { FavoritesProvider } from "../components/favorites/FavoritesContext";
import ScrollToTop from "../components/ScrollToTop";
import AIChatWidget from "../components/ai/AIChatWidget";
import AccessGateModal from "../components/AccessGateModal";

import OrganizationJsonLd from "../components/seo/OrganizationJsonLd";

/**
 * Metadata global para Tripoli Media
 *
 * Define metainformación SEO, Open Graph, Twitter Cards, y más.
 * Esta metadata se hereda en todas las páginas a menos que se sobreescriba.
 */
export const metadata = {
  metadataBase: new URL("https://www.tripoli.media"),
  title: {
    template: "%s | Tripoli Media",
    default: "Tripoli Media",
  },
  description:
    "Tripoli Media is a digital publishing house and media agency specializing in professional news coverage and sectoral analysis across six key industries: Consumer & Retail, Entertainment & Culture, IT Industry, Social Infrastructure, Politics & Law, and Healthcare.",
  applicationName: "Tripoli Media",
  authors: [{ name: "Tripoli Media" }],
  creator: "Tripoli Media",
  publisher: "Tripoli Media",
  category: "news",
  keywords: [
    "Tripoli Media",
    "digital publishing house",
    "media agency",
    "professional news",
    "sectoral analysis",
    "consumer and retail",
    "entertainment and culture",
    "IT industry",
    "social infrastructure",
    "politics and law",
    "healthcare",
    "agencias de medios",
    "noticias empresariales",
    "análisis sectorial",
  ],
  openGraph: {
    type: "website",
    siteName: "Tripoli Media",
    title: "Tripoli Media",
    description:
      "Tripoli Media is a digital publishing house and media agency specializing in professional news and analysis across six key sectors.",
    url: "https://www.tripoli.media",
    locale: "es_MX",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Tripoli Media — Digital Publishing House & Media Agency",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@tripolimedia",
    creator: "@tripolimedia",
    title: "Tripoli Media",
    description:
      "Professional news coverage and sectoral analysis across six key industries.",
    images: ["/opengraph-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://www.tripoli.media",
    languages: {
      "es-MX": "https://www.tripoli.media",
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.json",
  formatDetection: { telephone: false, address: false, email: false },
  verification: {
    google: "1J1f5pbHqCeB3GbE5F7p-GSweM4iXPK8CbTKh17OFj4",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-white text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-50">
        <FavoritesProvider>
          <OrganizationJsonLd />
          <ScrollToTop />
          <Header />
          {children}
          <Footer />
          <AccessGateModal />

          <AIChatWidget />
        </FavoritesProvider>
      </body>
    </html>
  );
}
