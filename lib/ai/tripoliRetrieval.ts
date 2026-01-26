import { getTripoliKnowledge, type TripoliSource } from "./tripoliKnowledge";

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const tokenize = (value: string) =>
  normalize(value)
    .split(/[^a-z0-9]+/g)
    .filter(Boolean);

const synonyms: Record<string, string[]> = {
  numero: ["telefono", "tel", "contacto", "phone", "number", "whatsapp"],
  telefono: ["numero", "tel", "contacto", "phone", "number", "whatsapp"],
  tel: ["telefono", "numero", "contacto", "phone", "number", "whatsapp"],
  whatsapp: ["telefono", "numero", "contacto"],
  correo: ["email", "mail", "contacto"],
  email: ["correo", "mail"],
  mail: ["correo", "email"],
  direccion: ["ubicacion", "domicilio", "address", "location", "mapa", "maps"],
  ubicacion: ["direccion", "domicilio", "address", "location", "mapa", "maps"],
  address: ["direccion", "ubicacion", "location", "mapa", "maps"],
  servicios: ["services", "service", "soluciones", "oferta"],
  services: ["servicios", "solutions", "oferta"],
  noticias: ["news", "notes", "notas", "novedades", "ultimas"],
  news: ["noticias", "notes", "notas", "novedades", "ultimas"],
  categorias: ["categoria", "categories", "secciones", "sectores"],
  categoria: ["categorias", "categories", "secciones", "sectores"],
  categories: ["categorias", "categoria", "secciones", "sectores"],
};

const expandTokens = (tokens: string[]) => {
  const expanded = new Set(tokens);
  tokens.forEach((token) => {
    const mapped = synonyms[token];
    if (mapped) {
      mapped.forEach((value) => expanded.add(value));
    }
  });
  return Array.from(expanded);
};

export const retrieveTripoliSources = (query: string, k = 6): TripoliSource[] => {
  const baseTokens = tokenize(query);
  if (!baseTokens.length) return [];

  const tokens = expandTokens(baseTokens);
  const sources = getTripoliKnowledge();

  const scored = sources
    .map((source) => {
      const title = normalize(source.title);
      const content = normalize(source.content);
      const tags = normalize(source.tags.join(" "));
      const url = normalize(source.url);
      let score = 0;

      tokens.forEach((token) => {
        if (title.includes(token)) score += 4;
        if (tags.includes(token)) score += 3;
        if (content.includes(token)) score += 1;
        if (url.includes(token)) score += 1;
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
