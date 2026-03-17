/**
 * StructuredData Component
 *
 * Implementa Schema.org JSON-LD structured data para mejorar SEO.
 * BreadcrumbList y ProfessionalService schemas (page-level).
 * Organization y WebSite schemas están en OrganizationJsonLd (layout-level).
 *
 * @see https://schema.org/
 * @see https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
 */

export default function StructuredData() {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Inicio',
        item: 'https://www.tripoli.media',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Servicios',
        item: 'https://www.tripoli.media/servicios',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Contacto',
        item: 'https://www.tripoli.media/contacto',
      },
    ],
  };

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'Tripoli Media',
    image: 'https://www.tripoli.media/Imagenes/Logos/01.png',
    '@id': 'https://www.tripoli.media',
    url: 'https://www.tripoli.media',
    telephone: '+52 33 2817 5756',
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Av de Las Rosas 585, Chapalita Sur, Int. 2',
      addressLocality: 'Zapopan',
      addressRegion: 'Jalisco',
      postalCode: '45040',
      addressCountry: 'MX',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 20.6746,
      longitude: -103.3953,
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '18:00',
    },
    sameAs: [
      'https://www.facebook.com/TripoliMediaMX',
      'https://x.com/tripolimedia',
      'https://www.instagram.com/tripoli.media/',
      'https://www.linkedin.com/company/tripoli-media',
    ],
  };

  return (
    <>
      {/* Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />

      {/* Local Business Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchema),
        }}
      />
    </>
  );
}
