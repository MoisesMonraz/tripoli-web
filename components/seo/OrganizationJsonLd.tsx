export default function OrganizationJsonLd() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://www.tripoli.media/#organization",
    name: "Tripoli Media",
    alternateName: "Tripoli Publishing House",
    url: "https://www.tripoli.media",
    logo: {
      "@type": "ImageObject",
      "@id": "https://www.tripoli.media/#logo",
      url: "https://www.tripoli.media/Imagenes/Logos/01.png",
      contentUrl: "https://www.tripoli.media/Imagenes/Logos/01.png",
      caption: "Tripoli Media Logo",
      inLanguage: "es-MX",
    },
    image: "https://www.tripoli.media/Imagenes/Logos/01.png",
    description:
      "Tripoli Media is a digital publishing house and media agency specializing in professional news coverage and sectoral analysis across six key industries in Mexico.",
    slogan: "Posiciona y destaca tu negocio",
    areaServed: {
      "@type": "Country",
      name: "Mexico",
      sameAs: "https://en.wikipedia.org/wiki/Mexico",
    },
    knowsLanguage: ["es"],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+52-33-2817-5756",
      contactType: "Customer Service",
      areaServed: "MX",
      availableLanguage: ["Spanish"],
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: "Av de Las Rosas 585, Chapalita Sur, Int. 2",
      addressLocality: "Zapopan",
      addressRegion: "Jalisco",
      postalCode: "45040",
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
    "@id": "https://www.tripoli.media/#website",
    name: "Tripoli Media",
    url: "https://www.tripoli.media",
    description:
      "Plataforma profesional de noticias y análisis sectorial para agencias de medios.",
    publisher: { "@id": "https://www.tripoli.media/#organization" },
    inLanguage: "es-MX",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://www.tripoli.media/buscar?q={search_term_string}",
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
