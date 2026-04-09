import type { Accionista, Categoria, Distribucion, Servicio, Venta } from '../types/finanzas';

export const ACCIONISTAS_SEED: Accionista[] = [
  { nombre: 'Moisés Monraz', rol: 'Director', porcentajeAcciones: 80 },
  { nombre: 'Juan Ignacio Armenta', rol: 'Contaduría', porcentajeAcciones: 2.5 },
  { nombre: 'Ricardo Núñez', rol: 'Producción Audiovisual', porcentajeAcciones: 2.5 },
  { nombre: 'Izcóatl Sánchez', rol: 'Coordinador Industria TI', porcentajeAcciones: 2.5 },
  { nombre: 'Emiliano Méndez', rol: 'Coordinador Política y Leyes', porcentajeAcciones: 2.5 },
  { nombre: 'Coordinador Consumo y Retail', rol: 'Coordinador', porcentajeAcciones: 2.5 },
  { nombre: 'Coordinador Entretenimiento y Cultura', rol: 'Coordinador', porcentajeAcciones: 2.5 },
  { nombre: 'Coordinador Infraestructura Social', rol: 'Coordinador', porcentajeAcciones: 2.5 },
  { nombre: 'Coordinador Sector Salud', rol: 'Coordinador', porcentajeAcciones: 2.5 },
];

export const SERVICIOS: Servicio[] = [
  'Editorial',
  'Analitica',
  'Web Structures',
  'Produccion Audiovisual',
  'Contaduria',
];

export const CATEGORIAS: Categoria[] = [
  'Consumo y Retail',
  'Entretenimiento y Cultura',
  'Industria TI',
  'Infraestructura Social',
  'Politica y Leyes',
  'Sector Salud',
];

export const CONTACTOS = [
  'Moisés Monraz',
  'Ricardo Núñez',
  'Juan Ignacio Armenta',
  'Izcóatl Sánchez',
  'Emiliano Méndez',
];

export const SERVICIO_LABELS: Record<Servicio, string> = {
  Editorial: 'Editorial',
  Analitica: 'Analítica',
  'Web Structures': 'Web Structures',
  'Produccion Audiovisual': 'Producción Audiovisual',
  Contaduria: 'Contaduría',
};

export const CATEGORIA_LABELS: Record<Categoria, string> = {
  'Consumo y Retail': 'Consumo y Retail',
  'Entretenimiento y Cultura': 'Entretenimiento y Cultura',
  'Industria TI': 'Industria TI',
  'Infraestructura Social': 'Infraestructura Social',
  'Politica y Leyes': 'Política y Leyes',
  'Sector Salud': 'Sector Salud',
};

export function getPrestador(servicio: Servicio): string {
  const map: Record<Servicio, string> = {
    Editorial: 'Moisés Monraz',
    Analitica: 'Moisés Monraz',
    'Web Structures': 'Moisés Monraz',
    'Produccion Audiovisual': 'Ricardo Núñez',
    Contaduria: 'Juan Ignacio Armenta',
  };
  return map[servicio];
}

export function getCoordinador(categoria: Categoria): string {
  const map: Record<Categoria, string> = {
    'Consumo y Retail': 'Moisés Monraz',
    'Entretenimiento y Cultura': 'Moisés Monraz',
    'Industria TI': 'Izcóatl Sánchez',
    'Infraestructura Social': 'Moisés Monraz',
    'Politica y Leyes': 'Emiliano Méndez',
    'Sector Salud': 'Moisés Monraz',
  };
  return map[categoria];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function calculateDistribution(
  montoNeto: number,
  servicio: Servicio,
  categoria: Categoria,
  contacto: string
): Distribucion {
  const prestadorNombre = getPrestador(servicio);
  const coordinadorNombre = getCoordinador(categoria);

  const prestadorMonto = round2(montoNeto * 0.7);
  const contactoMonto = round2(montoNeto * 0.125);
  const pool = round2(montoNeto * 0.1);
  const inversionTM = round2(montoNeto * 0.05);
  const coordinadorMonto = round2(montoNeto * 0.025);

  const accionistas = ACCIONISTAS_SEED.map((a) => ({
    nombre: a.nombre,
    porcentaje: a.porcentajeAcciones,
    monto: round2(pool * (a.porcentajeAcciones / 100)),
  }));

  const iva = round2(montoNeto * 0.16);
  const totalConIva = round2(montoNeto + iva);

  return {
    prestador: { nombre: prestadorNombre, monto: prestadorMonto },
    contacto: { nombre: contacto, monto: contactoMonto },
    accionistas,
    inversionTM,
    coordinador: { nombre: coordinadorNombre, monto: coordinadorMonto },
    subtotalNeto: montoNeto,
    iva,
    totalConIva,
  };
}

export function formatMXN(amount: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
}

export function getPersonEarnings(venta: Venta): Record<string, number> {
  const totals: Record<string, number> = {};
  const d = venta.distribucion;
  const add = (nombre: string, monto: number) => {
    totals[nombre] = (totals[nombre] || 0) + monto;
  };
  add(d.prestador.nombre, d.prestador.monto);
  add(d.contacto.nombre, d.contacto.monto);
  add(d.coordinador.nombre, d.coordinador.monto);
  d.accionistas.forEach((a) => add(a.nombre, a.monto));
  return totals;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}
