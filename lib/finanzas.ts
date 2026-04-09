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

// Umbrales de dilución de acciones para integrantes (excepto Director).
// Al alcanzar el acumulado de ganancias por rol antes del mes en curso,
// el porcentaje sube a partir del 1° del siguiente mes natural.
export const EQUITY_THRESHOLDS: { min: number; pct: number }[] = [
  { min: 21_100_000, pct: 9 },
  { min: 11_100_000, pct: 7 },
  { min: 1_100_000, pct: 5.5 },
  { min: 100_000, pct: 4 },
];

/** Devuelve el % de accionista correspondiente al total de ganancias por rol acumulado. */
export function getAccionistaTier(totalRol: number): number {
  for (const t of EQUITY_THRESHOLDS) {
    if (totalRol >= t.min) return t.pct;
  }
  return 2.5;
}

/** Devuelve el siguiente umbral al que aún no ha llegado la persona (o null si ya está en el máximo). */
export function getNextEquityThreshold(totalRol: number): { threshold: number; pct: number } | null {
  for (let i = EQUITY_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalRol < EQUITY_THRESHOLDS[i].min) {
      return { threshold: EQUITY_THRESHOLDS[i].min, pct: EQUITY_THRESHOLDS[i].pct };
    }
  }
  return null;
}

/**
 * Dado un mapa de ganancias por rol acumuladas ANTES del mes en curso (por nombre),
 * calcula el porcentaje efectivo de accionista para cada persona.
 * Moisés parte de 80% y pierde (tier - 2.5)% por cada integrante que sube de nivel.
 */
export function getEffectivePercentages(
  priorRolTotals: Record<string, number>
): Record<string, number> {
  const result: Record<string, number> = {};
  let moisesBase = 80;
  for (const acc of ACCIONISTAS_SEED) {
    if (acc.nombre === 'Moisés Monraz') continue;
    const total = priorRolTotals[acc.nombre] ?? 0;
    const tier = getAccionistaTier(total);
    result[acc.nombre] = tier;
    moisesBase -= tier - 2.5;
  }
  result['Moisés Monraz'] = Math.round(moisesBase * 100) / 100;
  return result;
}

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

/**
 * Calcula la distribución de una venta.
 * @param effectivePcts  Porcentajes vigentes por nombre (calculados según ganancias previas al mes).
 *                       Si se omite, usa los porcentajes base de ACCIONISTAS_SEED.
 */
export function calculateDistribution(
  montoNeto: number,
  servicio: Servicio,
  categoria: Categoria,
  contacto: string,
  effectivePcts?: Record<string, number>
): Distribucion {
  const prestadorNombre = getPrestador(servicio);
  const coordinadorNombre = getCoordinador(categoria);

  const prestadorMonto = round2(montoNeto * 0.7);
  const contactoMonto = round2(montoNeto * 0.125);
  const pool = round2(montoNeto * 0.1);
  const inversionTM = round2(montoNeto * 0.05);
  const coordinadorMonto = round2(montoNeto * 0.025);

  const accionistas = ACCIONISTAS_SEED.map((a) => {
    const pct = effectivePcts?.[a.nombre] ?? a.porcentajeAcciones;
    return {
      nombre: a.nombre,
      porcentaje: pct,
      monto: round2(pool * (pct / 100)),
    };
  });

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
