import { getTripoliKnowledge, type TripoliSource } from "./tripoliKnowledge";

/**
 * ==========================================
 * TRIPOLI MEDIA - INTELLIGENT RETRIEVAL SYSTEM
 * ==========================================
 *
 * Architecture: Modular retrieval with pluggable backends
 * Current: Lexical + Fuzzy + Synonym Expansion
 * Future: Ready for Vector DB (Pinecone, PGVector, etc.)
 *
 * Improvements from legacy system:
 * - Fuzzy matching for typo tolerance (Levenshtein distance)
 * - Enhanced scoring with decay for partial matches
 * - Expanded synonym dictionary with bidirectional mappings
 * - Modular interface for easy backend swap
 */

// ==========================================
// TYPES & INTERFACES
// ==========================================

/**
 * Retrieval configuration interface
 * Allows runtime tuning without code changes
 */
export type RetrievalConfig = {
  maxResults: number;
  fuzzyThreshold: number; // 0-1, lower = more strict
  weights: {
    exactTitle: number;
    fuzzyTitle: number;
    exactTag: number;
    fuzzyTag: number;
    exactContent: number;
    exactUrl: number;
  };
};

/**
 * Scored source result (internal)
 */
type ScoredSource = {
  source: TripoliSource;
  score: number;
  matchDetails?: {
    titleMatches: number;
    tagMatches: number;
    contentMatches: number;
  };
};

/**
 * Abstract retrieval strategy interface
 * Enables future vector DB swap without changing API route
 */
export interface RetrievalStrategy {
  retrieve(query: string, k: number): TripoliSource[];
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Normalizes text: lowercase + remove accents
 */
const normalize = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

/**
 * Tokenizes query into normalized words
 */
const tokenize = (value: string): string[] =>
  normalize(value)
    .split(/[^a-z0-9]+/g)
    .filter(Boolean);

/**
 * Levenshtein distance calculator (fuzzy string matching)
 * Returns edit distance between two strings
 */
const levenshteinDistance = (a: string, b: string): number => {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
};

/**
 * Calculates fuzzy similarity score (0-1)
 * 1 = exact match, 0 = completely different
 */
const fuzzyMatch = (query: string, target: string, threshold = 0.7): number => {
  if (query === target) return 1.0;

  const distance = levenshteinDistance(query, target);
  const maxLength = Math.max(query.length, target.length);

  if (maxLength === 0) return 0;

  const similarity = 1 - distance / maxLength;
  return similarity >= threshold ? similarity : 0;
};

// ==========================================
// ENHANCED SYNONYM DICTIONARY
// ==========================================

/**
 * Comprehensive bilingual synonym mapping
 * Bidirectional relationships for EN/ES queries
 */
const synonymDictionary: Record<string, string[]> = {
  // Core Tripoli Media brand terms
  tripoli: ["media", "contacto", "empresa", "sitio", "site", "company", "organization"],
  media: ["tripoli", "contacto", "empresa", "sitio", "site", "company"],
  empresa: ["tripoli", "media", "contacto", "sitio", "company", "organization", "negocio"],
  company: ["tripoli", "media", "empresa", "sitio", "organization"],

  // Contact & Information (bilingual)
  datos: ["contacto", "informacion", "telefono", "correo", "direccion", "data", "info"],
  informacion: ["datos", "contacto", "telefono", "correo", "direccion", "information", "info"],
  information: ["informacion", "datos", "contacto", "info"],
  contacto: ["datos", "informacion", "telefono", "correo", "email", "direccion", "whatsapp", "contact"],
  contact: ["contacto", "datos", "informacion", "telefono", "correo", "email", "direccion", "whatsapp"],

  // Phone variations
  numero: ["telefono", "tel", "contacto", "phone", "number", "whatsapp", "celular"],
  telefono: ["numero", "tel", "contacto", "phone", "number", "whatsapp", "celular"],
  tel: ["telefono", "numero", "contacto", "phone", "number", "whatsapp"],
  phone: ["telefono", "numero", "tel", "contacto", "whatsapp", "celular"],
  whatsapp: ["telefono", "numero", "contacto", "phone", "celular"],
  celular: ["telefono", "numero", "phone", "whatsapp"],

  // Email variations
  correo: ["email", "mail", "contacto", "electronico"],
  email: ["correo", "mail", "contacto"],
  mail: ["correo", "email", "contacto"],

  // Location & Address
  direccion: ["ubicacion", "domicilio", "address", "location", "mapa", "maps", "contacto", "donde"],
  ubicacion: ["direccion", "domicilio", "address", "location", "mapa", "maps", "contacto"],
  address: ["direccion", "ubicacion", "location", "mapa", "maps", "contacto"],
  location: ["ubicacion", "direccion", "address", "donde"],
  donde: ["direccion", "ubicacion", "address", "location", "mapa"],
  mapa: ["direccion", "ubicacion", "maps", "location"],
  maps: ["mapa", "direccion", "ubicacion", "location"],

  // Services (bilingual)
  servicios: ["services", "service", "soluciones", "oferta", "productos", "ofertas"],
  services: ["servicios", "soluciones", "oferta", "productos"],
  service: ["servicios", "services", "servicio"],
  soluciones: ["servicios", "services", "solutions", "oferta"],
  solutions: ["soluciones", "servicios", "services"],
  oferta: ["servicios", "services", "soluciones", "ofertas", "productos"],

  // News & Content
  noticias: ["news", "notes", "notas", "novedades", "ultimas", "articulos"],
  news: ["noticias", "notes", "notas", "novedades", "ultimas", "articulos"],
  notas: ["noticias", "news", "notes", "articulos"],
  articulos: ["noticias", "news", "notas", "articles"],
  articles: ["articulos", "noticias", "news"],

  // Categories (bilingual)
  categorias: ["categoria", "categories", "secciones", "sectores", "temas"],
  categoria: ["categorias", "categories", "category", "seccion", "sector"],
  categories: ["categorias", "categoria", "secciones", "sectores"],
  category: ["categoria", "categorias", "seccion"],
  secciones: ["categorias", "sections", "sectores"],
  sections: ["secciones", "categorias", "sectores"],

  // Industries & Sectors
  sectores: ["sectors", "industrias", "industries", "verticales", "areas", "categorias"],
  sectors: ["sectores", "industrias", "industries", "verticales", "areas"],
  industrias: ["industries", "sectores", "sectors", "mercados", "verticales"],
  industries: ["industrias", "sectores", "sectors", "markets", "verticales"],
  verticales: ["verticals", "sectores", "industries", "nichos"],
  verticals: ["verticales", "sectores", "industries", "nichos"],
  mercado: ["market", "industria", "sector", "area"],
  market: ["mercado", "industria", "sector", "area"],
  especialidad: ["specialty", "especialización", "especialidades", "nicho"],
  specialty: ["especialidad", "especialización", "nicho"],
  especializacion: ["specialization", "especialidad", "specialty", "expertise"],
  specialization: ["especializacion", "especialidad", "specialty"],
  nichos: ["niches", "especialidad", "verticales", "segmentos"],
  niches: ["nichos", "especialidad", "verticales", "segmentos"],
  segmentos: ["segments", "sectores", "areas", "nichos"],
  segments: ["segmentos", "sectores", "areas", "nichos"],

  // About / Company info
  conocenos: ["about", "quienes", "somos", "empresa", "tripoli", "nosotros"],
  about: ["conocenos", "quienes", "somos", "empresa", "tripoli", "nosotros"],
  quienes: ["conocenos", "about", "somos", "empresa", "nosotros", "who"],
  somos: ["conocenos", "about", "quienes", "empresa", "nosotros"],
  nosotros: ["conocenos", "about", "quienes", "somos", "us"],

  // Editorial & Publishing
  editorial: ["publishing", "contenido", "content", "redaccion", "articulos"],
  publishing: ["editorial", "contenido", "publicacion"],
  contenido: ["content", "editorial", "articulos", "material"],
  content: ["contenido", "editorial", "material"],

  // Analytics
  analitica: ["analytics", "analisis", "metricas", "kpi", "reportes"],
  analytics: ["analitica", "analisis", "metricas", "kpi", "reportes"],
  analisis: ["analitica", "analytics", "analysis"],
  analysis: ["analisis", "analitica", "analytics"],
  metricas: ["metrics", "kpi", "analitica"],
  metrics: ["metricas", "kpi", "analitica"],

  // Web & Digital
  web: ["website", "sitio", "site", "digital", "online", "internet"],
  website: ["web", "sitio", "site"],
  sitio: ["site", "web", "website", "pagina"],
  site: ["sitio", "web", "website", "pagina"],
  digital: ["web", "online", "internet"],

  // Schedule & Hours
  horarios: ["hours", "horario", "schedule", "tiempo", "atencion", "cuando"],
  horario: ["horarios", "hours", "schedule", "tiempo", "when"],
  hours: ["horarios", "horario", "schedule", "time", "cuando"],
  schedule: ["horarios", "horario", "hours", "tiempo", "agendar", "programar"],
  abierto: ["open", "abre", "hours", "horarios"],
  open: ["abierto", "abre", "hours", "horarios"],
  cerrado: ["closed", "cierra", "hours", "horarios"],
  closed: ["cerrado", "cierra", "hours", "horarios"],
  cuando: ["when", "horarios", "hours", "tiempo", "time"],
  when: ["cuando", "horarios", "hours", "tiempo", "time"],
  tiempo: ["time", "horarios", "hours", "schedule", "cuando"],
  time: ["tiempo", "horarios", "hours", "schedule", "when"],

  // Appointments & Meetings
  cita: ["appointment", "reunion", "meeting", "agendar", "booking", "consulta"],
  appointment: ["cita", "reunion", "meeting", "agendar", "booking", "consulta"],
  agendar: ["book", "booking", "schedule", "programar", "reservar", "cita", "appointment"],
  book: ["agendar", "booking", "reservar", "schedule", "cita", "appointment"],
  booking: ["agendar", "book", "reservar", "cita", "appointment"],
  reunion: ["meeting", "cita", "appointment", "junta", "consulta"],
  meeting: ["reunion", "cita", "appointment", "junta", "consulta"],
  junta: ["reunion", "meeting", "cita", "appointment"],
  programar: ["schedule", "agendar", "book", "reservar"],
  reservar: ["reserve", "book", "agendar", "booking", "cita"],
  reserve: ["reservar", "book", "agendar", "booking", "cita"],
  consulta: ["consultation", "cita", "appointment", "reunion", "meeting"],
  consultation: ["consulta", "cita", "appointment", "reunion", "meeting"],
  calendario: ["calendar", "cal", "agendar", "schedule"],
  calendar: ["calendario", "cal", "agendar", "schedule"],
  hablar: ["talk", "speak", "contacto", "reunion", "chat"],
  talk: ["hablar", "speak", "contacto", "reunion", "chat"],
  demo: ["demonstration", "presentacion", "reunion", "meeting"],

  // Business Types & Subcategories
  fabricantes: ["manufacturers", "fabricas", "productores", "makers"],
  manufacturers: ["fabricantes", "fabricas", "productores", "makers"],
  proveedores: ["suppliers", "vendors", "suministradores"],
  suppliers: ["proveedores", "vendors", "suministradores"],
  mayoristas: ["wholesalers", "distribuidores", "mayorista"],
  wholesalers: ["mayoristas", "distribuidores"],
  cadenas: ["chains", "franquicias", "retail"],
  chains: ["cadenas", "franquicias", "retail"],
  tiendas: ["stores", "shops", "comercios", "locales"],
  stores: ["tiendas", "shops", "comercios"],
  conveniencia: ["convenience", "oxxo", "7eleven"],
  convenience: ["conveniencia", "negocios"],
  productoras: ["producers", "production", "produccion"],
  producers: ["productoras", "production", "produccion"],
  recintos: ["venues", "lugares", "espacios", "auditorios"],
  venues: ["recintos", "lugares", "espacios", "auditorios"],
  festivales: ["festivals", "eventos", "ferias"],
  festivals: ["festivales", "eventos", "ferias"],
  desarrolladores: ["developers", "constructores", "builders"],
  developers: ["desarrolladores", "constructores", "builders"],
  inmobiliarios: ["real estate", "bienes raices", "propiedades"],
  promotores: ["promoters", "desarrolladores", "constructores"],
  organismos: ["agencies", "organizations", "entidades", "instituciones"],
  agencies: ["organismos", "organizations", "entidades"],
  juridicos: ["legal", "abogados", "lawyers", "derecho"],
  legal: ["juridicos", "abogados", "lawyers", "derecho"],
  insumos: ["supplies", "materiales", "recursos"],
  supplies: ["insumos", "materiales", "recursos"],
};

/**
 * Expands query tokens with synonyms
 * Bidirectional: Spanish query matches English content and vice versa
 */
const expandTokensWithSynonyms = (tokens: string[]): string[] => {
  const expanded = new Set(tokens);

  tokens.forEach((token) => {
    const synonyms = synonymDictionary[token];
    if (synonyms) {
      synonyms.forEach((synonym) => expanded.add(synonym));
    }
  });

  return Array.from(expanded);
};

// ==========================================
// DEFAULT CONFIGURATION
// ==========================================

const DEFAULT_CONFIG: RetrievalConfig = {
  maxResults: 6,
  fuzzyThreshold: 0.75, // 75% similarity minimum for fuzzy matches
  weights: {
    exactTitle: 5.0,    // Highest weight for exact title match
    fuzzyTitle: 3.0,    // Good weight for fuzzy title match
    exactTag: 4.0,      // High weight for tag matches
    fuzzyTag: 2.5,      // Decent weight for fuzzy tag match
    exactContent: 1.0,  // Base weight for content matches
    exactUrl: 2.0,      // URL matches are valuable
  },
};

// ==========================================
// LEXICAL RETRIEVAL STRATEGY (Current)
// ==========================================

/**
 * Lexical retrieval with fuzzy matching and synonym expansion
 * This is the current production strategy
 */
class LexicalRetrievalStrategy implements RetrievalStrategy {
  constructor(private config: RetrievalConfig = DEFAULT_CONFIG) {}

  retrieve(query: string, k: number = this.config.maxResults): TripoliSource[] {
    const baseTokens = tokenize(query);
    if (!baseTokens.length) return [];

    // Expand with synonyms for better recall
    const expandedTokens = expandTokensWithSynonyms(baseTokens);
    const sources = getTripoliKnowledge();

    // Score each source
    const scoredSources: ScoredSource[] = sources.map((source) => {
      const normalizedTitle = normalize(source.title);
      const normalizedContent = normalize(source.content);
      const normalizedTags = source.tags.map(normalize);
      const normalizedUrl = normalize(source.url);

      let score = 0;
      let titleMatches = 0;
      let tagMatches = 0;
      let contentMatches = 0;

      // Score against each token
      expandedTokens.forEach((token) => {
        // Exact title match
        if (normalizedTitle.includes(token)) {
          score += this.config.weights.exactTitle;
          titleMatches++;
        } else {
          // Fuzzy title match
          const titleWords = normalizedTitle.split(/\s+/);
          for (const word of titleWords) {
            const similarity = fuzzyMatch(token, word, this.config.fuzzyThreshold);
            if (similarity > 0) {
              score += this.config.weights.fuzzyTitle * similarity;
              titleMatches += similarity;
              break; // Only count best match per token
            }
          }
        }

        // Exact tag match
        if (normalizedTags.some((tag) => tag.includes(token))) {
          score += this.config.weights.exactTag;
          tagMatches++;
        } else {
          // Fuzzy tag match
          for (const tag of normalizedTags) {
            const similarity = fuzzyMatch(token, tag, this.config.fuzzyThreshold);
            if (similarity > 0) {
              score += this.config.weights.fuzzyTag * similarity;
              tagMatches += similarity;
              break;
            }
          }
        }

        // Exact content match
        if (normalizedContent.includes(token)) {
          score += this.config.weights.exactContent;
          contentMatches++;
        }

        // URL match
        if (normalizedUrl.includes(token)) {
          score += this.config.weights.exactUrl;
        }
      });

      return {
        source,
        score,
        matchDetails: { titleMatches, tagMatches, contentMatches },
      };
    });

    // Filter, sort, and return top-k
    return scoredSources
      .filter((item) => item.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        // Tie-breaker: prefer more title matches
        if (b.matchDetails!.titleMatches !== a.matchDetails!.titleMatches) {
          return b.matchDetails!.titleMatches - a.matchDetails!.titleMatches;
        }
        // Final tie-breaker: alphabetical by ID
        return a.source.id.localeCompare(b.source.id);
      })
      .slice(0, k)
      .map((item) => item.source);
  }
}

// ==========================================
// VECTOR RETRIEVAL STRATEGY (Future)
// ==========================================

/**
 * Placeholder for future vector-based retrieval
 * Swap this in when ready to integrate Pinecone/PGVector
 *
 * Example usage:
 * ```typescript
 * class VectorRetrievalStrategy implements RetrievalStrategy {
 *   constructor(private vectorDB: VectorDBClient) {}
 *
 *   async retrieve(query: string, k: number): Promise<TripoliSource[]> {
 *     const embedding = await this.vectorDB.embed(query);
 *     const results = await this.vectorDB.search(embedding, k);
 *     return results.map(r => r.metadata as TripoliSource);
 *   }
 * }
 * ```
 */

// ==========================================
// PUBLIC API
// ==========================================

/**
 * Main retrieval function
 * Uses the current active strategy (Lexical + Fuzzy)
 *
 * @param query - User's search query
 * @param k - Number of results to return (default: 6)
 * @returns Array of most relevant TripoliSource objects
 */
export const retrieveTripoliSources = (query: string, k = 6): TripoliSource[] => {
  const strategy = new LexicalRetrievalStrategy();
  return strategy.retrieve(query, k);
};

/**
 * Retrieval with custom configuration
 * Useful for A/B testing or fine-tuning
 */
export const retrieveWithConfig = (
  query: string,
  config: Partial<RetrievalConfig>
): TripoliSource[] => {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const strategy = new LexicalRetrievalStrategy(mergedConfig);
  return strategy.retrieve(query, mergedConfig.maxResults);
};
