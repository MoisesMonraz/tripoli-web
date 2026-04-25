export interface PageItem {
  orden: number;
  imageURL: string;
  descripcionAlt: string;
}

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
  portadaURL: string;
  categorias: CategoriaSlug[];
  paginas: PageItem[];
  marcas: string[];
  fechaPublicacion: string; // YYYY-MM-DD
  estado: EstadoRevista;
  totalPaginas: number;
  createdAt: any;
  updatedAt: any;
}

export type RevistaDraft = Omit<Revista, 'id' | 'createdAt' | 'updatedAt'>;

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
