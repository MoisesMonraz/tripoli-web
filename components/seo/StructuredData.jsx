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
        item: 'https://tripoli.media',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Servicios',
        item: 'https://tripoli.media/servicios',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Contacto',
        item: 'https://tripoli.media/contacto',
      },
    ],
  };

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'Tripoli Media',
    image: 'https://tripoli.media/opengraph-image.png',
    '@id': 'https://tripoli.media',
    url: 'https://tripoli.media',
    telephone: '+52 33 2817 5756',
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'P. de los Virreyes 45, Puerta de Hierro',
      addressLocality: 'Zapopan',
      addressRegion: 'Jalisco',
      postalCode: '45116',
      addressCountry: 'MX',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 20.6597,
      longitude: -103.4098,
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
