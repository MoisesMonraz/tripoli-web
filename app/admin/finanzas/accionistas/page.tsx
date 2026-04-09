'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getVentas, seedAccionistas } from '../../../../lib/actions/finanzas-actions';
import {
  ACCIONISTAS_SEED,
  EQUITY_THRESHOLDS,
  getAccionistaTier,
  getNextEquityThreshold,
  getEffectivePercentages,
  formatMXN,
  formatDate,
} from '../../../../lib/finanzas';
import type { Venta } from '../../../../types/finanzas';

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function formatMonthLabel(monthStr: string) {
  const [year, month] = monthStr.split('-');
  return `${MONTH_NAMES[parseInt(month) - 1]} ${year}`;
}

function FinanzasNav() {
  return (
    <div className="flex gap-2 flex-wrap items-center">
      {[
        { href: '/admin/finanzas', label: 'Dashboard' },
        { href: '/admin/finanzas/nueva-venta', label: 'Nueva Venta' },
        { href: '/admin/finanzas/ventas', label: 'Ventas' },
        { href: '/admin/finanzas/accionistas', label: 'Accionistas' },
      ].map((l) => (
        <a key={l.href} href={l.href}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${l.href === '/admin/finanzas/accionistas' ? 'bg-[#1E3A5F] text-white' : 'border border-slate-200 text-slate-600 hover:border-[#1E3A5F] hover:text-[#1E3A5F]'}`}>
          {l.label}
        </a>
      ))}
      <a href="/admin" className="ml-auto text-xs text-slate-400 hover:text-slate-600 transition">← Admin</a>
    </div>
  );
}

/** Acumula ganancias por rol (prestador+contacto+coordinador) de un conjunto de ventas. */
function computeRolTotals(ventas: Venta[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const v of ventas) {
    const d = v.distribucion;
    if (!d) continue;
    const add = (nombre: string | undefined, monto: number) => {
      if (!nombre) return;
      totals[nombre] = (totals[nombre] ?? 0) + monto;
    };
    add(d.prestador?.nombre, d.prestador?.monto ?? 0);
    add(d.contacto?.nombre, d.contacto?.monto ?? 0);
    add(d.coordinador?.nombre, d.coordinador?.monto ?? 0);
  }
  return totals;
}

export default function AccionistasPage() {
  const [isChecking, setIsChecking] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedAccionista, setExpandedAccionista] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const fetchStatus = useCallback(async () => {
    setIsChecking(true);
    try {
      const res = await fetch('/api/admin/status');
      if (!res.ok) { setSession(null); return; }
      setSession(await res.json());
    } catch { setSession(null); }
    finally { setIsChecking(false); }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      await seedAccionistas();
      const result = await getVentas();
      if (result.ok && result.ventas) setVentas(result.ventas);
    } catch { /* no-op */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);
  useEffect(() => { if (session?.ok) fetchData(); }, [session, fetchData]);

  // Mes actual en formato 'YYYY-MM'
  const currentMonthStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    ventas.forEach(v => {
      const d = new Date(v.fechaEmision + 'T00:00:00');
      months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });
    return Array.from(months).sort().reverse();
  }, [ventas]);

  const ventasFiltradas = useMemo(() => {
    if (selectedMonth === 'all') return ventas;
    return ventas.filter(v => v.fechaEmision.substring(0, 7) === selectedMonth);
  }, [ventas, selectedMonth]);

  // Ganancias por rol acumuladas ANTES del mes actual (para calcular tiers vigentes)
  const priorMonthRolTotals = useMemo(() =>
    computeRolTotals(ventas.filter(v => v.fechaEmision.substring(0, 7) < currentMonthStr)),
    [ventas, currentMonthStr]
  );

  // Ganancias por rol acumuladas en TODO el histórico (para ver si subirán de tier el próximo mes)
  const allTimeRolTotals = useMemo(() => computeRolTotals(ventas), [ventas]);

  // Porcentajes efectivos actuales (basados en ganancias pre-mes-actual)
  const effectivePctsNow = useMemo(() => getEffectivePercentages(priorMonthRolTotals), [priorMonthRolTotals]);
  // Porcentajes que aplicarán el próximo mes (basados en todo el histórico incluyendo mes actual)
  const effectivePctsNext = useMemo(() => getEffectivePercentages(allTimeRolTotals), [allTimeRolTotals]);

  if (isChecking) {
    return <main className="min-h-screen bg-white px-6 py-16"><p className="text-sm text-slate-500">Verificando sesión...</p></main>;
  }
  if (!session?.ok) {
    return (
      <main className="min-h-screen bg-white px-6 py-16">
        <p className="text-sm text-slate-500">Acceso no autorizado. <a href="/admin" className="text-[#1E3A5F] underline">Volver</a></p>
      </main>
    );
  }

  // Section 1 — filtrado por mes
  const totalNetoFiltrado = ventasFiltradas.reduce((s, v) => s + v.montoNeto, 0);
  const totalPoolFiltrado = ventasFiltradas.reduce((s, v) => s + (v.distribucion?.accionistas?.reduce((ss, a) => ss + a.monto, 0) ?? 0), 0);
  const totalInversionTM = ventasFiltradas.reduce((s, v) => s + (v.distribucion?.inversionTM ?? 0), 0);
  const totalIVA = ventasFiltradas.reduce((s, v) => s + v.iva, 0);

  const accionistasData = ACCIONISTAS_SEED.map((acc) => {
    const nombre = acc.nombre;
    const accionistaVentas = ventasFiltradas.filter((v) => v.distribucion?.accionistas?.some((a) => a.nombre === nombre));
    const totalAccionista = accionistaVentas.reduce((s, v) => {
      const share = v.distribucion.accionistas.find((a) => a.nombre === nombre);
      return s + (share?.monto ?? 0);
    }, 0);
    const totalPrestador = ventasFiltradas.filter(v => v.distribucion?.prestador?.nombre === nombre).reduce((s, v) => s + v.distribucion.prestador.monto, 0);
    const totalContacto = ventasFiltradas.filter(v => v.distribucion?.contacto?.nombre === nombre).reduce((s, v) => s + v.distribucion.contacto.monto, 0);
    const totalCoordinador = ventasFiltradas.filter(v => v.distribucion?.coordinador?.nombre === nombre).reduce((s, v) => s + v.distribucion.coordinador.monto, 0);
    const totalCombinado = totalAccionista + totalPrestador + totalContacto + totalCoordinador;
    return { ...acc, accionistaVentas, totalAccionista, totalPrestador, totalContacto, totalCoordinador, totalCombinado };
  });

  // Section 2 — histórico completo con tier dinámico
  const accionistasHistorico = ACCIONISTAS_SEED.map((acc) => {
    const nombre = acc.nombre;
    const totalRol = allTimeRolTotals[nombre] ?? 0;
    const totalPrestador = ventas.filter(v => v.distribucion?.prestador?.nombre === nombre).reduce((s, v) => s + v.distribucion.prestador.monto, 0);
    const totalContacto = ventas.filter(v => v.distribucion?.contacto?.nombre === nombre).reduce((s, v) => s + v.distribucion.contacto.monto, 0);
    const totalCoordinador = ventas.filter(v => v.distribucion?.coordinador?.nombre === nombre).reduce((s, v) => s + v.distribucion.coordinador.monto, 0);
    const pctNow = effectivePctsNow[nombre] ?? acc.porcentajeAcciones;
    const pctNext = effectivePctsNext[nombre] ?? acc.porcentajeAcciones;
    const nextThreshold = nombre !== 'Moisés Monraz' ? getNextEquityThreshold(totalRol) : null;
    return { ...acc, totalPrestador, totalContacto, totalCoordinador, totalRol, pctNow, pctNext, nextThreshold };
  });

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl flex flex-col gap-6">
        <header className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-semibold mb-1">Finanzas</p>
            <h1 className="text-2xl font-bold text-slate-900">Accionistas</h1>
          </div>
          <FinanzasNav />
        </header>

        {loading ? (
          <div className="py-12 text-center text-sm text-slate-500">Cargando datos...</div>
        ) : (
          <>
            {/* Sección 1 — Distribución de ingresos por ventas de servicios */}
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
                <h2 className="text-sm font-semibold text-slate-800">Distribución de ingresos por ventas de servicios</h2>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wider whitespace-nowrap">Período seleccionado:</span>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30"
                  >
                    <option value="all">Todos los meses</option>
                    {availableMonths.map(m => (
                      <option key={m} value={m}>{formatMonthLabel(m)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tarjetas de resumen dentro de la sección */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 p-6 border-b border-slate-100">
                {[
                  { label: 'Ingresos netos', value: formatMXN(totalNetoFiltrado) },
                  { label: 'Pool accionistas (10%)', value: formatMXN(totalPoolFiltrado) },
                  { label: 'Inversión TM (5%)', value: formatMXN(totalInversionTM) },
                  { label: 'Impuestos / IVA (16%)', value: formatMXN(totalIVA) },
                ].map((c) => (
                  <div key={c.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-slate-500 mb-1">{c.label}</p>
                    <p className="text-lg font-bold text-[#1E3A5F]">{c.value}</p>
                  </div>
                ))}
              </div>

              {/* Acordeón por accionista — sin barra, sin rol, sin % */}
              <div className="divide-y divide-slate-200">
                {accionistasData.map((acc) => {
                  const isExpanded = expandedAccionista === acc.nombre;
                  return (
                    <div key={acc.nombre}>
                      <button type="button" onClick={() => setExpandedAccionista(isExpanded ? null : acc.nombre)}
                        className="w-full text-left px-6 py-4 hover:bg-slate-50/80 transition-colors">
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-semibold text-slate-900 text-sm">{acc.nombre}</span>
                          <div className="text-right shrink-0">
                            <p className="text-base font-bold text-[#1E3A5F]">{formatMXN(acc.totalCombinado)}</p>
                            <p className="text-xs text-slate-400">total combinado</p>
                          </div>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="bg-slate-50 border-t border-slate-100 px-6 py-5">
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-5">
                            {[
                              { label: 'Como Prestador', value: acc.totalPrestador },
                              { label: 'Como Contacto', value: acc.totalContacto },
                              { label: 'Como Coordinador', value: acc.totalCoordinador },
                              { label: 'Como Accionista', value: acc.totalAccionista },
                            ].map((item) => (
                              <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-3">
                                <p className="text-xs text-slate-500 mb-0.5">{item.label}</p>
                                <p className="text-sm font-semibold text-slate-800">{formatMXN(item.value)}</p>
                              </div>
                            ))}
                          </div>

                          <div className="mt-4">
                            <a href={`/admin/finanzas/coordinadores/${encodeURIComponent(acc.nombre)}`}
                              className="text-base font-bold text-[#1E3A5F] hover:underline">Ver detalle completo por rol →</a>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Sección 2 — Histórico de ganancias por rol con tiers dinámicos */}
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-4">
                <h2 className="text-sm font-semibold text-slate-800">Ganancias por rol</h2>
                <p className="text-xs text-slate-400 mt-0.5">Histórico acumulado total · Los % de accionista se actualizan automáticamente al inicio del mes siguiente</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <tr className="divide-x divide-slate-200">
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider">Nombre</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-center">Rol</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-center">Contacto</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-center">Coordinador</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-center">Total</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-center">Accionista</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {accionistasHistorico.map((acc) => {
                      const levelingUp = acc.pctNext > acc.pctNow;
                      return (
                        <tr key={acc.nombre} className="hover:bg-slate-50/60 transition-colors divide-x divide-slate-100">
                          <td className="px-5 py-3.5">
                            <span className="font-medium text-slate-900">{acc.nombre}</span>
                            <span className="ml-2 text-xs text-slate-400 bg-slate-100 rounded-full px-2 py-0.5 align-middle">{acc.rol}</span>
                          </td>
                          <td className="px-5 py-3.5 text-center text-slate-600">{acc.totalPrestador > 0 ? formatMXN(acc.totalPrestador) : <span className="text-slate-300">—</span>}</td>
                          <td className="px-5 py-3.5 text-center text-slate-600">{acc.totalContacto > 0 ? formatMXN(acc.totalContacto) : <span className="text-slate-300">—</span>}</td>
                          <td className="px-5 py-3.5 text-center text-slate-600">{acc.totalCoordinador > 0 ? formatMXN(acc.totalCoordinador) : <span className="text-slate-300">—</span>}</td>
                          <td className="px-5 py-3.5 text-center font-bold text-[#1E3A5F]">
                            {acc.totalRol > 0 ? formatMXN(acc.totalRol) : <span className="text-slate-300 font-normal">—</span>}
                            {/* Barra de progreso al siguiente tier */}
                            {acc.nextThreshold && acc.totalRol > 0 && (
                              <div className="mt-1.5">
                                <div className="h-1 bg-slate-100 rounded-full w-full">
                                  <div
                                    className="h-1 bg-[#1E3A5F]/40 rounded-full transition-all"
                                    style={{ width: `${Math.min(100, (acc.totalRol / acc.nextThreshold.threshold) * 100)}%` }}
                                  />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5 text-left">
                                  {formatMXN(acc.nextThreshold.threshold - acc.totalRol)} para {acc.nextThreshold.pct}%
                                </p>
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className="text-sm font-semibold text-slate-700">{acc.pctNow}%</span>
                            {levelingUp && (
                              <span className="ml-1.5 text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-1.5 py-0.5 align-middle whitespace-nowrap">
                                → {acc.pctNext}% próx. mes
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                    <tr className="divide-x divide-slate-200">
                      <td className="px-5 py-3 text-xs font-bold uppercase text-slate-600">Total</td>
                      <td className="px-5 py-3 text-center font-bold text-[#1E3A5F]">{formatMXN(accionistasHistorico.reduce((s, a) => s + a.totalPrestador, 0))}</td>
                      <td className="px-5 py-3 text-center font-bold text-[#1E3A5F]">{formatMXN(accionistasHistorico.reduce((s, a) => s + a.totalContacto, 0))}</td>
                      <td className="px-5 py-3 text-center font-bold text-[#1E3A5F]">{formatMXN(accionistasHistorico.reduce((s, a) => s + a.totalCoordinador, 0))}</td>
                      <td className="px-5 py-3 text-center font-bold text-[#1E3A5F]">{formatMXN(accionistasHistorico.reduce((s, a) => s + a.totalRol, 0))}</td>
                      <td className="px-5 py-3 text-center text-slate-400">—</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
