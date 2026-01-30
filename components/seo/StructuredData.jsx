/**
 * StructuredData Component
 *
 * Implementa Schema.org JSON-LD structured data para mejorar SEO.
 * Ayuda a Google y otros motores de búsqueda a entender el contenido del sitio.
 *
 * @see https://schema.org/
 * @see https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
 */

export default function StructuredData() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Tripoli Media',
    url: 'https://tripolimedia.com',
    logo: 'https://tripolimedia.com/Logos/logo-tripoli.png',
    description:
      'Plataforma profesional de noticias y análisis para agencias especializada en 6 sectores clave.',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+52 33 2817 5756',
      contactType: 'Customer Service',
      areaServed: 'MX',
      availableLanguage: ['Spanish', 'English'],
    },
    sameAs: [
      'https://facebook.com/tripolimedia',
      'https://linkedin.com/company/tripolimedia',
      'https://twitter.com/tripolimedia',
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'P. de los Virreyes 45, Puerta de Hierro',
      addressLocality: 'Zapopan',
      addressRegion: 'Jalisco',
      postalCode: '45116',
      addressCountry: 'MX',
    },
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Tripoli Media',
    url: 'https://tripolimedia.com',
    description:
      'Plataforma profesional de noticias y análisis sectorial para agencias de medios.',
    publisher: {
      '@type': 'Organization',
      name: 'Tripoli Media',
      logo: {
        '@type': 'ImageObject',
        url: 'https://tripolimedia.com/Logos/logo-tripoli.png',
      },
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://tripolimedia.com/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Inicio',
        item: 'https://tripolimedia.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Servicios',
        item: 'https://tripolimedia.com/servicios',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Contacto',
        item: 'https://tripolimedia.com/contacto',
      },
    ],
  };

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'Tripoli Media',
    image: 'https://tripolimedia.com/opengraph-image',
    '@id': 'https://tripolimedia.com',
    url: 'https://tripolimedia.com',
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
      'https://facebook.com/tripolimedia',
      'https://linkedin.com/company/tripolimedia',
      'https://twitter.com/tripolimedia',
    ],
  };

  return (
    <>
      {/* Organization Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />

      {/* Website Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />

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
