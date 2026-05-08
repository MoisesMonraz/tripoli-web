export interface Revista {
  id: string;
  titulo: string;
  slug: string;
  descripcion: string;
  autor: {
    nombre: string;
    slug: string;
  };
  categoria: {
    nombre: string;
    slug: string;
  };
  subcategoria?: {
    nombre: string;
    slug: string;
  };
  previewUrl: string;
  ogUrl?: string;
  pdfUrl: string;
  fechaPublicacion: string;
}
