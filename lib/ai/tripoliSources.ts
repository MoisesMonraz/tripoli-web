export type TripoliSource = {
  id: string;
  title: string;
  url: string;
  content: string;
  tags: string[];
};

export const TRIPOLI_SOURCES: TripoliSource[] = [
  {
    id: "contacto",
    title: "Contacto",
    url: "/contacto",
    content:
      "Tripoli Media contact information. Email: contacto@tripoli.media. Phone/WhatsApp: +52 33 2817 5756. Address: P. de los Virreyes 45, Puerta de Hierro, 45116 Zapopan, Jal.",
    tags: ["contacto", "contact", "email", "correo", "telefono", "phone", "whatsapp", "direccion", "address", "ubicacion"],
  },
  {
    id: "servicios-overview",
    title: "Servicios",
    url: "/servicios",
    content:
      "Tripoli Media services include editorial coverage, advanced analytics, and web solutions focused on visibility, digital performance, and strategic positioning.",
    tags: ["servicios", "services", "editorial", "analytics", "web", "marketing", "posicionamiento", "visibility"],
  },
  {
    id: "servicios-editorial",
    title: "Tripoli Publishing House",
    url: "/servicios",
    content:
      "Tripoli Publishing House: editorial coverage focused on brand positioning with strategic reach and sector visibility. Includes editorial notes, opinion pieces, advertorials, and distribution on LinkedIn, Facebook, and X.",
    tags: ["editorial", "publishing", "contenido", "content", "linkedin", "facebook", "x", "twitter"],
  },
  {
    id: "servicios-analytics",
    title: "Tripoli Analytic Services",
    url: "/servicios",
    content:
      "Tripoli Analytic Services: advanced analytics for executive decision-making, ROI optimization, and data-driven growth. Includes Google Analytics and Meta Analytics reporting, KPI definitions, and paid media strategy.",
    tags: ["analytics", "analitica", "kpi", "roi", "google", "meta", "ads", "reporting"],
  },
  {
    id: "servicios-web",
    title: "Tripoli Web Services",
    url: "/servicios",
    content:
      "Tripoli Web Services: custom web platforms focused on performance, security, SEO, and digital commerce enablement, including domain setup, corporate email, and marketplace integrations.",
    tags: ["web", "seo", "ecommerce", "retail", "platform", "seguridad", "security"],
  },
  {
    id: "conocenos",
    title: "Con\u00f3cenos",
    url: "/conocenos",
    content:
      "Tripoli Media is a digital ecosystem that integrates specialized editorial content, advanced analytics, and web solutions to help organizations gain visibility, organize information, and make measurable decisions.",
    tags: ["conocenos", "about", "mission", "ecosystem", "editorial", "analytics", "web", "tripoli media"],
  },
  {
    id: "categoria-consumo",
    title: "Consumo y Retail",
    url: "/categoria/consumo-y-retail",
    content:
      "Consumo y Retail covers: Fabricantes y Proveedores, Cadenas Comerciales, and Tiendas de Conveniencia.",
    tags: ["consumo", "retail", "fabricantes", "proveedores", "cadenas", "conveniencia"],
  },
  {
    id: "categoria-entretenimiento",
    title: "Entretenimiento y Cultura",
    url: "/categoria/entretenimiento-y-cultura",
    content:
      "Entretenimiento y Cultura covers: Productoras de Contenido, Recintos Culturales, and Festivales, Eventos y Artistas.",
    tags: ["entretenimiento", "cultura", "productoras", "recintos", "festivales", "eventos", "artistas"],
  },
  {
    id: "categoria-industria-ti",
    title: "Industria TI",
    url: "/categoria/industria-ti",
    content:
      "Industria TI covers: Fabricantes de Tecnolog\u00eda, Mayoristas TI, and Canales de Distribuci\u00f3n.",
    tags: ["industria", "ti", "tecnologia", "mayoristas", "canales", "distribucion"],
  },
  {
    id: "categoria-infraestructura-social",
    title: "Infraestructura Social",
    url: "/categoria/infraestructura-social",
    content:
      "Infraestructura Social covers: Proveedores de Materiales, Desarrolladores de Proyectos, and Promotores Inmobiliarios.",
    tags: ["infraestructura", "social", "proveedores", "materiales", "desarrolladores", "promotores"],
  },
  {
    id: "categoria-politica-leyes",
    title: "Pol\u00edtica y Leyes",
    url: "/categoria/politica-y-leyes",
    content:
      "Pol\u00edtica y Leyes covers: Organismos P\u00fablicos, Administraci\u00f3n Estatal y Local, and Servicios Jur\u00eddicos.",
    tags: ["politica", "leyes", "organismos", "publicos", "administracion", "juridicos"],
  },
  {
    id: "categoria-sector-salud",
    title: "Sector Salud",
    url: "/categoria/sector-salud",
    content:
      "Sector Salud covers: Fabricantes de Equipos e Insumos, Instituciones de Salud, and Especialistas M\u00e9dicos.",
    tags: ["salud", "sector", "equipos", "insumos", "instituciones", "especialistas", "medicos"],
  },
];

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export const retrieveSources = (question: string, k = 6): TripoliSource[] => {
  const tokens = normalize(question)
    .split(/[^a-z0-9]+/g)
    .filter(Boolean);

  if (!tokens.length) return [];

  const scored = TRIPOLI_SOURCES.map((source) => {
    const title = normalize(source.title);
    const content = normalize(source.content);
    const tags = normalize(source.tags.join(" "));
    let score = 0;

    tokens.forEach((token) => {
      if (title.includes(token)) score += 3;
      if (tags.includes(token)) score += 2;
      if (content.includes(token)) score += 1;
    });

    return { source, score };
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.source.id.localeCompare(b.source.id);
    });

  return scored.slice(0, k).map((item) => item.source);
};
