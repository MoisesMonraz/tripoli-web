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
      "Tripoli Media es un ecosistema digital con contenido editorial especializado, analítica avanzada y soluciones web para impulsar visibilidad y decisiones medibles.",
    tags: ["tripoli", "media", "sitio", "descripcion", "ecosistema"],
  },
  {
    id: "contacto",
    title: "Contacto",
    url: "/contacto",
    section: "Contacto",
    content:
      "Contacto de Tripoli Media. Teléfono y WhatsApp: +52 33 2817 5756. Correo: contacto@tripoli.media. Dirección: P. de los Virreyes 45, Puerta de Hierro, 45116 Zapopan, Jal.",
    tags: [
      "contacto",
      "telefono",
      "tel",
      "numero",
      "whatsapp",
      "correo",
      "email",
      "mail",
      "direccion",
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
      "Tripoli Media ofrece soluciones editoriales, analíticas y web enfocadas en visibilidad, desempeño digital y posicionamiento estratégico.",
    tags: ["servicios", "editorial", "analitica", "web", "soluciones"],
  },
  {
    id: "servicios-editorial",
    title: "Tripoli Publishing House",
    url: "/servicios",
    section: "Servicios",
    content:
      "Tripoli Publishing House brinda cobertura editorial para posicionamiento de marca y visibilidad sectorial; incluye notas editoriales, artículos de opinión y publirreportajes, con distribución en LinkedIn, Facebook y X.",
    tags: ["publishing", "editorial", "contenido", "linkedin", "facebook", "x", "twitter"],
  },
  {
    id: "servicios-analytics",
    title: "Tripoli Analytic Services",
    url: "/servicios",
    section: "Servicios",
    content:
      "Tripoli Analytic Services ofrece analítica avanzada para decisiones ejecutivas, optimización de ROI y crecimiento basado en datos; incluye Google Analytics, Meta Analytics, definición de KPIs y pauta digital.",
    tags: ["analytics", "analitica", "kpi", "roi", "google", "meta", "ads", "pauta", "reporting"],
  },
  {
    id: "servicios-web",
    title: "Tripoli Web Services",
    url: "/servicios",
    section: "Servicios",
    content:
      "Tripoli Web Services crea plataformas web personalizadas enfocadas en rendimiento, seguridad y SEO, con integraciones de comercio digital.",
    tags: ["web", "seo", "seguridad", "ecommerce", "retail", "plataformas"],
  },
  {
    id: "conocenos",
    title: "Conócenos",
    url: "/conocenos",
    section: "Conócenos",
    content:
      "Tripoli Media es un ecosistema digital que integra contenido editorial especializado, analítica avanzada y soluciones web para ganar visibilidad, organizar información y tomar decisiones medibles.",
    tags: ["conocenos", "ecosistema", "editorial", "analytics", "web", "tripoli"],
  },
  {
    id: "noticias",
    title: "Noticias y notas",
    url: "/",
    section: "Inicio",
    content:
      "En la página principal hay secciones de últimas noticias por categoría.",
    tags: ["noticias", "notas", "ultimas", "inicio"],
  },
  {
    id: "calendario",
    title: "Calendario",
    url: "/calendario",
    section: "Calendario",
    content:
      "Consulta la fecha y hora actual desde el calendario editorial de Tripoli Media.",
    tags: ["fecha", "hora", "hoy", "dia", "calendario", "que dia"],
  },
  {
    id: "categoria-consumo",
    title: "Consumo y Retail",
    url: "/categoria/consumo-y-retail",
    section: "Categorías",
    content:
      "Consumo y Retail incluye Fabricantes y Proveedores, Cadenas Comerciales y Negocios de Conveniencia.",
    tags: ["consumo", "retail", "fabricantes", "proveedores", "cadenas", "comerciales", "conveniencia", "negocios"],
  },
  {
    id: "categoria-entretenimiento",
    title: "Entretenimiento y Cultura",
    url: "/categoria/entretenimiento-y-cultura",
    section: "Categorías",
    content:
      "Entretenimiento y Cultura incluye Productoras de Contenido, Recintos Culturales y Festivales, Eventos y Artistas.",
    tags: ["entretenimiento", "cultura", "productoras", "contenido", "recintos", "culturales", "festivales", "eventos", "artistas"],
  },
  {
    id: "categoria-industria-ti",
    title: "Industria TI",
    url: "/categoria/industria-ti",
    section: "Categorías",
    content:
      "Industria TI incluye Fabricantes de Tecnología, Mayoristas TI y Canales de Distribución.",
    tags: ["industria", "ti", "tecnologia", "mayoristas", "canales", "distribucion"],
  },
  {
    id: "categoria-infraestructura",
    title: "Infraestructura Social",
    url: "/categoria/infraestructura-social",
    section: "Categorías",
    content:
      "Infraestructura Social incluye Proveedores de Materiales, Desarrolladores de Proyectos y Promotores Inmobiliarios.",
    tags: ["infraestructura", "social", "proveedores", "materiales", "desarrolladores", "promotores", "inmobiliarios"],
  },
  {
    id: "categoria-politica",
    title: "Política y Leyes",
    url: "/categoria/politica-y-leyes",
    section: "Categorías",
    content:
      "Política y Leyes incluye Organismos Públicos, Administración Estatal y Local, y Servicios Jurídicos.",
    tags: ["politica", "leyes", "organismos", "publicos", "administracion", "estatal", "local", "juridicos"],
  },
  {
    id: "categoria-salud",
    title: "Sector Salud",
    url: "/categoria/sector-salud",
    section: "Categorías",
    content:
      "Sector Salud incluye Fabricantes de Equipos e Insumos, Instituciones de Salud y Especialistas Médicos.",
    tags: ["salud", "sector", "equipos", "insumos", "instituciones", "especialistas", "medicos"],
  },
  {
    id: "horarios-atencion",
    title: "Horarios de Atención",
    url: "/contacto",
    section: "Contacto",
    content:
      "Nuestro horario de atención es de lunes a viernes de 09:00 a 18:00 hrs, y sábados de 09:00 a 13:00 hrs (GMT-6). Los domingos permanecemos cerrados.",
    tags: [
      "horarios",
      "atencion",
      "tiempo",
      "cuando",
      "abierto",
      "cerrado",
      "sabado",
      "domingo",
      "lunes",
      "viernes",
      "semana",
      "horario",
      "contacto",
    ],
  },
  {
    id: "agendar-cita",
    title: "Agendar Cita",
    url: "https://cal.com/tripolimedia/reunion-de-1-hr",
    section: "Contacto",
    content:
      "Para agendar una reunión estratégica de 1 hora directamente con el equipo, utiliza nuestro calendario oficial aquí: https://cal.com/tripolimedia/reunion-de-1-hr.",
    tags: [
      "cita",
      "agendar",
      "reunion",
      "link",
      "enlace",
      "cal",
      "calendario",
      "programar",
      "demo",
      "consulta",
      "reservar",
      "hablar",
      "contacto",
      "junta",
    ],
  },
  {
    id: "sectores-principales",
    title: "Sectores de Especialización",
    url: "/servicios",
    section: "Servicios",
    content:
      "Tripoli Media estructura sus servicios en 6 grandes sectores: 1) Consumo y Retail, 2) Entretenimiento y Cultura, 3) Industria TI, 4) Infraestructura Social, 5) Política y Leyes, y 6) Sector Salud.",
    tags: [
      "sectores",
      "industrias",
      "mercado",
      "categorias",
      "areas",
      "especialidad",
      "verticales",
      "nichos",
      "segmentos",
      "servicios",
    ],
  },
  {
    id: "detalle-subcategorias",
    title: "Subcategorías y Nichos",
    url: "/servicios",
    section: "Servicios",
    content:
      "Atendemos las siguientes subcategorías específicas: 1. Consumo y Retail (Fabricantes y Proveedores, Cadenas Comerciales, Negocios de Conveniencia). 2. Entretenimiento y Cultura (Productoras de Contenido, Recintos Culturales, Festivales, Eventos y Artistas). 3. Industria TI (Fabricantes de Tecnología, Mayoristas TI, Canales de Distribución). 4. Infraestructura Social (Proveedores de Materiales, Desarrolladores de Proyectos, Promotores Inmobiliarios). 5. Política y Leyes (Organismos Públicos, Administración Pública, Servicios Jurídicos). 6. Sector Salud (Fabricantes de equipos e insumos, Instituciones de Salud, Especialistas Médicos).",
    tags: [
      "fabricantes",
      "proveedores",
      "cadenas",
      "tiendas",
      "conveniencia",
      "productoras",
      "recintos",
      "festivales",
      "eventos",
      "artistas",
      "tecnologia",
      "mayoristas",
      "distribucion",
      "canales",
      "materiales",
      "desarrolladores",
      "inmobiliarios",
      "promotores",
      "organismos",
      "publicos",
      "administracion",
      "juridicos",
      "insumos",
      "instituciones",
      "especialistas",
      "medicos",
      "subcategorias",
      "nichos",
    ],
  },
];
