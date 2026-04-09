'use client';

import { useCallback, useEffect, useState } from 'react';
import { getVentas, seedAccionistas } from '../../../../lib/actions/finanzas-actions';
import { ACCIONISTAS_SEED, formatMXN, formatDate } from '../../../../lib/finanzas';
import type { Venta } from '../../../../types/finanzas';

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

export default function AccionistasPage() {
  const [isChecking, setIsChecking] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedAccionista, setExpandedAccionista] = useState<string | null>(null);

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

  const totalNetoAll = ventas.reduce((s, v) => s + v.montoNeto, 0);
  const totalPool = ventas.reduce((s, v) => s + (v.distribucion?.accionistas?.reduce((ss, a) => ss + a.monto, 0) ?? 0), 0);

  const accionistasData = ACCIONISTAS_SEED.map((acc) => {
    const nombre = acc.nombre;
    const accionistaVentas = ventas.filter((v) => v.distribucion?.accionistas?.some((a) => a.nombre === nombre));
    const totalAccionista = accionistaVentas.reduce((s, v) => {
      const share = v.distribucion.accionistas.find((a) => a.nombre === nombre);
      return s + (share?.monto ?? 0);
    }, 0);
    const ventasPrestador = ventas.filter((v) => v.distribucion?.prestador?.nombre === nombre);
    const totalPrestador = ventasPrestador.reduce((s, v) => s + v.distribucion.prestador.monto, 0);
    const ventasContacto = ventas.filter((v) => v.distribucion?.contacto?.nombre === nombre);
    const totalContacto = ventasContacto.reduce((s, v) => s + v.distribucion.contacto.monto, 0);
    const ventasCoordinador = ventas.filter((v) => v.distribucion?.coordinador?.nombre === nombre);
    const totalCoordinador = ventasCoordinador.reduce((s, v) => s + v.distribucion.coordinador.monto, 0);
    const totalCombinado = totalAccionista + totalPrestador + totalContacto + totalCoordinador;
    return { ...acc, accionistaVentas, totalAccionista, totalPrestador, totalContacto, totalCoordinador, totalCombinado };
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: 'Total ingresos netos', value: formatMXN(totalNetoAll) },
            { label: 'Pool accionistas (10%)', value: formatMXN(totalPool) },
            { label: 'Total ventas', value: ventas.length.toString() },
          ].map((c) => (
            <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs text-slate-500 mb-1">{c.label}</p>
              <p className="text-xl font-bold text-[#1E3A5F]">{c.value}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-slate-500">Cargando datos...</div>
        ) : (
          <>
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-4">
                <h2 className="text-sm font-semibold text-slate-800">Distribución por accionista</h2>
              </div>
              <div className="divide-y divide-slate-200">
                {accionistasData.map((acc) => {
                  const isExpanded = expandedAccionista === acc.nombre;
                  return (
                    <div key={acc.nombre}>
                      <button type="button" onClick={() => setExpandedAccionista(isExpanded ? null : acc.nombre)}
                        className="w-full text-left px-6 py-4 hover:bg-slate-50/80 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-slate-900 text-sm">{acc.nombre}</span>
                              <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">{acc.rol}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-100 rounded-full h-1.5 max-w-xs">
                                <div className="h-1.5 bg-[#1E3A5F] rounded-full" style={{ width: `${acc.porcentajeAcciones}%` }} />
                              </div>
                              <span className="text-xs text-slate-500">{acc.porcentajeAcciones}% acciones</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-lg font-bold text-[#1E3A5F]">{formatMXN(acc.totalCombinado)}</p>
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

                          {acc.accionistaVentas.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Participación como accionista</p>
                              <div className="overflow-x-auto rounded-lg border border-slate-200">
                                <table className="min-w-full text-xs">
                                  <thead className="bg-slate-100 text-slate-500">
                                    <tr>
                                      <th className="px-3 py-2 text-left font-semibold">Fecha</th>
                                      <th className="px-3 py-2 text-left font-semibold">Cliente</th>
                                      <th className="px-3 py-2 text-right font-semibold">Monto neto</th>
                                      <th className="px-3 py-2 text-right font-semibold">Accionista</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-200 bg-white">
                                    {acc.accionistaVentas.map((v) => {
                                      const share = v.distribucion.accionistas.find((a) => a.nombre === acc.nombre);
                                      return (
                                        <tr key={v.id}>
                                          <td className="px-3 py-2 text-slate-600">{formatDate(v.fechaEmision)}</td>
                                          <td className="px-3 py-2 font-medium text-slate-900">{v.cliente}</td>
                                          <td className="px-3 py-2 text-right text-slate-600">{formatMXN(v.montoNeto)}</td>
                                          <td className="px-3 py-2 text-right font-semibold text-[#1E3A5F]">{formatMXN(share?.monto ?? 0)}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          <div className="mt-3">
                            <a href={`/admin/finanzas/coordinadores/${encodeURIComponent(acc.nombre)}`}
                              className="text-xs text-[#1E3A5F] hover:underline">Ver detalle completo por rol →</a>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-4">
                <h2 className="text-sm font-semibold text-slate-800">Ganancias por rol</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Nombre</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">Prestador</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">Contacto</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">Coordinador</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">Accionista</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {accionistasData.map((acc) => (
                      <tr key={acc.nombre} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">{acc.nombre}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{acc.totalPrestador > 0 ? formatMXN(acc.totalPrestador) : '—'}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{acc.totalContacto > 0 ? formatMXN(acc.totalContacto) : '—'}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{acc.totalCoordinador > 0 ? formatMXN(acc.totalCoordinador) : '—'}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{formatMXN(acc.totalAccionista)}</td>
                        <td className="px-4 py-3 text-right font-bold text-[#1E3A5F]">{formatMXN(acc.totalCombinado)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                    <tr>
                      <td className="px-4 py-3 text-xs font-bold uppercase text-slate-600">Total</td>
                      {[0, 1, 2, 3, 4].map((i) => {
                        const total = accionistasData.reduce((s, a) => s + [
                          a.totalPrestador, a.totalContacto, a.totalCoordinador, a.totalAccionista, a.totalCombinado
                        ][i], 0);
                        return <td key={i} className="px-4 py-3 text-right font-bold text-[#1E3A5F]">{formatMXN(total)}</td>;
                      })}
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
