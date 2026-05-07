export type CategoriaSlug =
  | 'consumo-y-retail'
  | 'entretenimiento-y-cultura'
  | 'industria-ti'
  | 'infraestructura-social'
  | 'politica-y-leyes'
  | 'sector-salud';

export type EstadoRevista = 'borrador' | 'publicada';

export interface Revista {
  id: string;
  slug: string;
  titulo: string;
  descripcion: string;
  autor: string;
  subcategoria?: string;
  /** 600×600 square image used in cards and category pages */
  previewURL: string;
  /** Deprecated — kept for existing documents without previewURL */
  portadaURL?: string;
  pdfURL: string;
  categorias: CategoriaSlug[];
  marcas: string[];
  fechaPublicacion: string;
  estado: EstadoRevista;
  totalPaginas: number;
  createdAt: any;
  updatedAt: any;
}

export const CATEGORIA_LABELS: Record<CategoriaSlug, string> = {
  'consumo-y-retail': 'Consumo y Retail',
  'entretenimiento-y-cultura': 'Entretenimiento y Cultura',
  'industria-ti': 'Industria TI',
  'infraestructura-social': 'Infraestructura Social',
  'politica-y-leyes': 'Política y Leyes',
  'sector-salud': 'Sector Salud',
};

export const ALL_CATEGORIAS: CategoriaSlug[] = [
  'consumo-y-retail',
  'entretenimiento-y-cultura',
  'industria-ti',
  'infraestructura-social',
  'politica-y-leyes',
  'sector-salud',
];
