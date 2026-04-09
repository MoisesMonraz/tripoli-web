export type Servicio =
  | 'Editorial'
  | 'Analitica'
  | 'Web Structures'
  | 'Produccion Audiovisual'
  | 'Contaduria';

export type Categoria =
  | 'Consumo y Retail'
  | 'Entretenimiento y Cultura'
  | 'Industria TI'
  | 'Infraestructura Social'
  | 'Politica y Leyes'
  | 'Sector Salud';

export interface Accionista {
  id?: string;
  nombre: string;
  rol: string;
  porcentajeAcciones: number;
}

export interface DistribucionAccionista {
  nombre: string;
  porcentaje: number;
  monto: number;
}

export interface Distribucion {
  prestador: { nombre: string; monto: number };
  contacto: { nombre: string; monto: number };
  accionistas: DistribucionAccionista[];
  inversionTM: number;
  coordinador: { nombre: string; monto: number };
  subtotalNeto: number;
  iva: number;
  totalConIva: number;
}

export interface Venta {
  id?: string;
  cliente: string;
  fechaEmision: string;
  servicio: Servicio;
  categoria: Categoria;
  contacto: string;
  montoNeto: number;
  iva: number;
  montoTotal: number;
  prestadorServicio: string;
  coordinadorCategoria: string;
  distribucion: Distribucion;
  createdAt?: any;
}
