export default function OrganizationJsonLd() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://tripoli.media/#organization",
    name: "Tripoli Media",
    alternateName: "Tripoli Publishing House",
    url: "https://tripoli.media",
    logo: {
      "@type": "ImageObject",
      "@id": "https://tripoli.media/#logo",
      url: "https://tripoli.media/Logos/logo-tripoli.png",
      contentUrl: "https://tripoli.media/Logos/logo-tripoli.png",
      caption: "Tripoli Media Logo",
      inLanguage: "es-MX",
    },
    image: "https://tripoli.media/Logos/logo-tripoli.png",
    description:
      "Tripoli Media is a digital publishing house and media agency specializing in professional news coverage and sectoral analysis across six key industries in Mexico.",
    slogan: "Posiciona y destaca tu negocio",
    areaServed: {
      "@type": "Country",
      name: "Mexico",
      sameAs: "https://en.wikipedia.org/wiki/Mexico",
    },
    knowsLanguage: ["es", "en"],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+52-33-2817-5756",
      contactType: "Customer Service",
      areaServed: "MX",
      availableLanguage: ["Spanish", "English"],
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: "P. de los Virreyes 45, Puerta de Hierro",
      addressLocality: "Zapopan",
      addressRegion: "Jalisco",
      postalCode: "45116",
      addressCountry: "MX",
    },
    sameAs: [
      "https://www.facebook.com/TripoliMediaMX",
      "https://x.com/tripolimedia",
      "https://www.instagram.com/tripoli.media/",
      "https://www.linkedin.com/company/tripoli-media",
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://tripoli.media/#website",
    name: "Tripoli Media",
    url: "https://tripoli.media",
    description:
      "Plataforma profesional de noticias y análisis sectorial para agencias de medios.",
    publisher: { "@id": "https://tripoli.media/#organization" },
    inLanguage: ["es-MX", "en-US"],
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://tripoli.media/buscar?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  );
}
