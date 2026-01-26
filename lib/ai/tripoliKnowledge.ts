export type TripoliSource = {
  id: string;
  title: string;
  url: string;
  section?: string;
  content: string;
  tags: string[];
};

export const getTripoliKnowledge = (): TripoliSource[] => [
  {
    id: "tripoli-media",
    title: "Tripoli Media",
    url: "/",
    section: "Sitio",
    content:
      "ES: Tripoli Media es un ecosistema digital con contenido editorial especializado, anal\u00edtica avanzada y soluciones web para impulsar visibilidad y decisiones medibles. EN: Tripoli Media is a digital ecosystem with specialized editorial content, advanced analytics, and web solutions to drive visibility and measurable decisions.",
    tags: ["tripoli", "media", "sitio", "site", "descripcion", "about", "ecosistema"],
  },
  {
    id: "contacto",
    title: "Contacto",
    url: "/contacto",
    section: "Contacto",
    content:
      "ES: Contacto de Tripoli Media. Tel\u00e9fono y WhatsApp: +52 33 2817 5756. Correo: contacto@tripoli.media. Direcci\u00f3n: P. de los Virreyes 45, Puerta de Hierro, 45116 Zapopan, Jal. EN: Tripoli Media contact. Phone and WhatsApp: +52 33 2817 5756. Email: contacto@tripoli.media. Address: P. de los Virreyes 45, Puerta de Hierro, 45116 Zapopan, Jal.",
    tags: [
      "contacto",
      "contact",
      "telefono",
      "tel",
      "numero",
      "phone",
      "whatsapp",
      "correo",
      "email",
      "mail",
      "direccion",
      "address",
      "ubicacion",
      "zapopan",
      "virreyes",
      "puerta",
      "hierro",
    ],
  },
  {
    id: "servicios",
    title: "Servicios",
    url: "/servicios",
    section: "Servicios",
    content:
      "ES: Tripoli Media ofrece soluciones editoriales, anal\u00edticas y web enfocadas en visibilidad, desempe\u00f1o digital y posicionamiento estrat\u00e9gico. EN: Tripoli Media offers editorial, analytics, and web solutions focused on visibility, digital performance, and strategic positioning.",
    tags: ["servicios", "services", "editorial", "analitica", "analytics", "web", "soluciones", "solutions"],
  },
  {
    id: "servicios-editorial",
    title: "Tripoli Publishing House",
    url: "/servicios",
    section: "Servicios",
    content:
      "ES: Tripoli Publishing House brinda cobertura editorial para posicionamiento de marca y visibilidad sectorial; incluye notas editoriales, art\u00edculos de opini\u00f3n y publirreportajes, con distribuci\u00f3n en LinkedIn, Facebook y X. EN: Tripoli Publishing House provides editorial coverage for brand positioning and sector visibility, including editorial notes, opinion pieces, advertorials, and distribution on LinkedIn, Facebook, and X.",
    tags: ["publishing", "editorial", "contenido", "content", "linkedin", "facebook", "x", "twitter"],
  },
  {
    id: "servicios-analytics",
    title: "Tripoli Analytic Services",
    url: "/servicios",
    section: "Servicios",
    content:
      "ES: Tripoli Analytic Services ofrece anal\u00edtica avanzada para decisiones ejecutivas, optimizaci\u00f3n de ROI y crecimiento basado en datos; incluye Google Analytics, Meta Analytics, definici\u00f3n de KPIs y pauta digital. EN: Tripoli Analytic Services delivers advanced analytics for executive decisions, ROI optimization, and data-driven growth, including Google Analytics, Meta Analytics, KPI definition, and paid media.",
    tags: ["analytics", "analitica", "kpi", "roi", "google", "meta", "ads", "pauta", "reporting"],
  },
  {
    id: "servicios-web",
    title: "Tripoli Web Services",
    url: "/servicios",
    section: "Servicios",
    content:
      "ES: Tripoli Web Services crea plataformas web personalizadas enfocadas en rendimiento, seguridad y SEO, con integraciones de comercio digital. EN: Tripoli Web Services builds custom web platforms focused on performance, security, and SEO with digital commerce integrations.",
    tags: ["web", "seo", "seguridad", "security", "ecommerce", "retail", "platform", "plataformas"],
  },
  {
    id: "conocenos",
    title: "Con\u00f3cenos",
    url: "/conocenos",
    section: "Con\u00f3cenos",
    content:
      "ES: Tripoli Media es un ecosistema digital que integra contenido editorial especializado, anal\u00edtica avanzada y soluciones web para ganar visibilidad, organizar informaci\u00f3n y tomar decisiones medibles. EN: Tripoli Media is a digital ecosystem combining specialized editorial content, advanced analytics, and web solutions to gain visibility, organize information, and make measurable decisions.",
    tags: ["conocenos", "about", "ecosistema", "ecosystem", "editorial", "analytics", "web", "tripoli"],
  },
  {
    id: "noticias",
    title: "Noticias y notas",
    url: "/",
    section: "Inicio",
    content:
      "ES: En la p\u00e1gina principal hay secciones de \u00daltimas noticias por categor\u00eda. EN: The homepage includes latest news sections by category.",
    tags: ["noticias", "news", "notas", "notes", "ultimas", "latest", "inicio", "home"],
  },
  {
    id: "categoria-consumo",
    title: "Consumo y Retail",
    url: "/categoria/consumo-y-retail",
    section: "Categor\u00edas",
    content:
      "ES: Consumo y Retail incluye Fabricantes y Proveedores, Cadenas Comerciales y Tiendas de Conveniencia. EN: Consumer & Retail includes Manufacturers & Suppliers, Retail Chains, and Convenience Stores.",
    tags: ["consumo", "retail", "fabricantes", "proveedores", "cadenas", "comerciales", "conveniencia", "tiendas"],
  },
  {
    id: "categoria-entretenimiento",
    title: "Entretenimiento y Cultura",
    url: "/categoria/entretenimiento-y-cultura",
    section: "Categor\u00edas",
    content:
      "ES: Entretenimiento y Cultura incluye Productoras de Contenido, Recintos Culturales y Festivales, Eventos y Artistas. EN: Entertainment & Culture includes Content Producers, Cultural Venues, and Festivals, Events & Artists.",
    tags: ["entretenimiento", "cultura", "productoras", "contenido", "recintos", "culturales", "festivales", "eventos", "artistas"],
  },
  {
    id: "categoria-industria-ti",
    title: "Industria TI",
    url: "/categoria/industria-ti",
    section: "Categor\u00edas",
    content:
      "ES: Industria TI incluye Fabricantes de Tecnolog\u00eda, Mayoristas TI y Canales de Distribuci\u00f3n. EN: IT Industry includes Technology Manufacturers, IT Wholesalers, and Distribution Channels.",
    tags: ["industria", "ti", "tecnologia", "mayoristas", "canales", "distribucion"],
  },
  {
    id: "categoria-infraestructura",
    title: "Infraestructura Social",
    url: "/categoria/infraestructura-social",
    section: "Categor\u00edas",
    content:
      "ES: Infraestructura Social incluye Proveedores de Materiales, Desarrolladores de Proyectos y Promotores Inmobiliarios. EN: Social Infrastructure includes Materials Suppliers, Project Developers, and Real Estate Developers.",
    tags: ["infraestructura", "social", "proveedores", "materiales", "desarrolladores", "promotores", "inmobiliarios"],
  },
  {
    id: "categoria-politica",
    title: "Pol\u00edtica y Leyes",
    url: "/categoria/politica-y-leyes",
    section: "Categor\u00edas",
    content:
      "ES: Pol\u00edtica y Leyes incluye Organismos P\u00fablicos, Administraci\u00f3n Estatal y Local, y Servicios Jur\u00eddicos. EN: Politics & Law includes Public Agencies, State & Local Administration, and Legal Services.",
    tags: ["politica", "leyes", "organismos", "publicos", "administracion", "estatal", "local", "juridicos"],
  },
  {
    id: "categoria-salud",
    title: "Sector Salud",
    url: "/categoria/sector-salud",
    section: "Categor\u00edas",
    content:
      "ES: Sector Salud incluye Fabricantes de Equipos e Insumos, Instituciones de Salud y Especialistas M\u00e9dicos. EN: Health Sector includes Equipment & Supplies Manufacturers, Healthcare Institutions, and Medical Specialists.",
    tags: ["salud", "sector", "equipos", "insumos", "instituciones", "especialistas", "medicos"],
  },
];
