'use client';

import { useCallback, useEffect, useState } from 'react';
import { getVentas } from '../../../lib/actions/finanzas-actions';
import {
  CATEGORIAS,
  CATEGORIA_LABELS,
  SERVICIOS,
  SERVICIO_LABELS,
  formatMXN,
  formatDate,
} from '../../../lib/finanzas';
import type { Venta } from '../../../types/finanzas';

function FinanzasNav({ active }: { active: string }) {
  const links = [
    { href: '/admin/finanzas', label: 'Dashboard' },
    { href: '/admin/finanzas/nueva-venta', label: 'Nueva Venta' },
    { href: '/admin/finanzas/ventas', label: 'Ventas' },
    { href: '/admin/finanzas/accionistas', label: 'Accionistas' },
  ];
  return (
    <div className="flex gap-2 flex-wrap items-center">
      {links.map((l) => (
        <a
          key={l.href}
          href={l.href}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            active === l.href
              ? 'bg-[#1E3A5F] text-white'
              : 'border border-slate-200 text-slate-600 hover:border-[#1E3A5F] hover:text-[#1E3A5F]'
          }`}
        >
          {l.label}
        </a>
      ))}
      <a href="/admin" className="ml-auto text-xs text-slate-400 hover:text-slate-600 transition">
        ← Admin
      </a>
    </div>
  );
}

export default function FinanzasDashboard() {
  const [isChecking, setIsChecking] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    setIsChecking(true);
    try {
      const res = await fetch('/api/admin/status');
      if (!res.ok) { setSession(null); return; }
      setSession(await res.json());
    } catch { setSession(null); }
    finally { setIsChecking(false); }
  }, []);

  const fetchVentas = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getVentas();
      if (result.ok && result.ventas) setVentas(result.ventas);
    } catch { /* no-op */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);
  useEffect(() => { if (session?.ok) fetchVentas(); }, [session, fetchVentas]);

  if (isChecking) {
    return (
      <main className="min-h-screen bg-white px-6 py-16 text-slate-900">
        <p className="text-sm text-slate-500">Verificando sesión...</p>
      </main>
    );
  }

  if (!session?.ok) {
    return (
      <main className="min-h-screen bg-white px-6 py-16 text-slate-900">
        <p className="text-sm text-slate-500">
          Acceso no autorizado.{' '}
          <a href="/admin" className="text-[#1E3A5F] underline">Volver al admin</a>
        </p>
      </main>
    );
  }

  const totalVentas = ventas.length;
  const totalNeto = ventas.reduce((s, v) => s + v.montoNeto, 0);
  const totalIva = ventas.reduce((s, v) => s + v.iva, 0);
  const totalConIva = ventas.reduce((s, v) => s + v.montoTotal, 0);
  const totalInversion = ventas.reduce((s, v) => s + (v.distribucion?.inversionTM ?? 0), 0);

  const catMax = Math.max(
    1,
    ...CATEGORIAS.map((c) =>
      ventas.filter((v) => v.categoria === c).reduce((s, v) => s + v.montoNeto, 0)
    )
  );
  const svcMax = Math.max(
    1,
    ...SERVICIOS.map((s) =>
      ventas.filter((v) => v.servicio === s).reduce((sum, v) => sum + v.montoNeto, 0)
    )
  );

  const last5 = ventas.slice(0, 5);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">

        <header className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-semibold mb-1">Finanzas</p>
              <h1 className="text-2xl font-bold text-slate-900">Dashboard Financiero</h1>
            </div>
            <a
              href="/admin/finanzas/nueva-venta"
              className="inline-flex items-center gap-2 rounded-lg bg-[#1E3A5F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#162d4a] transition shadow-sm"
            >
              + Registrar nueva venta
            </a>
          </div>
          <div className="mt-4">
            <FinanzasNav active="/admin/finanzas" />
          </div>
        </header>

        {loading ? (
          <div className="text-sm text-slate-500 text-center py-12">Cargando datos...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              {[
                { label: 'Total ventas', value: totalVentas.toString() },
                { label: 'Ingresos netos', value: formatMXN(totalNeto) },
                { label: 'IVA generado', value: formatMXN(totalIva) },
                { label: 'Total con IVA', value: formatMXN(totalConIva) },
                { label: 'Inversión acumulada TM', value: formatMXN(totalInversion) },
              ].map((card) => (
                <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs text-slate-500 mb-1">{card.label}</p>
                  <p className="text-xl font-bold text-[#1E3A5F] break-all">{card.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-4">
                  <h2 className="text-sm font-semibold text-slate-800">Por Categoría</h2>
                </div>
                <div className="p-6 flex flex-col gap-4">
                  {CATEGORIAS.map((cat) => {
                    const cvs = ventas.filter((v) => v.categoria === cat);
                    const neto = cvs.reduce((s, v) => s + v.montoNeto, 0);
                    const pct = Math.round((neto / catMax) * 100);
                    return (
                      <div key={cat}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-600 truncate">{CATEGORIA_LABELS[cat]}</span>
                          <span className="text-xs font-medium text-slate-800 ml-2 shrink-0">
                            {formatMXN(neto)} <span className="text-slate-400">({cvs.length})</span>
                          </span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full">
                          <div className="h-2 bg-[#1E3A5F] rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-4">
                  <h2 className="text-sm font-semibold text-slate-800">Por Servicio</h2>
                </div>
                <div className="p-6 flex flex-col gap-4">
                  {SERVICIOS.map((svc) => {
                    const svs = ventas.filter((v) => v.servicio === svc);
                    const neto = svs.reduce((s, v) => s + v.montoNeto, 0);
                    const pct = Math.round((neto / svcMax) * 100);
                    return (
                      <div key={svc}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-600 truncate">{SERVICIO_LABELS[svc]}</span>
                          <span className="text-xs font-medium text-slate-800 ml-2 shrink-0">
                            {formatMXN(neto)} <span className="text-slate-400">({svs.length})</span>
                          </span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full">
                          <div className="h-2 bg-[#1E3A5F] rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-800">Últimas ventas</h2>
                <a href="/admin/finanzas/ventas" className="text-xs text-[#1E3A5F] hover:underline">Ver todas →</a>
              </div>
              {last5.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500">
                  No hay ventas registradas aún.{' '}
                  <a href="/admin/finanzas/nueva-venta" className="text-[#1E3A5F] hover:underline">Registrar primera venta</a>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        {['Fecha', 'Cliente', 'Servicio', 'Categoría', 'Contacto', 'Neto', 'Total'].map((h) => (
                          <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {last5.map((v) => (
                        <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap text-slate-600">{formatDate(v.fechaEmision)}</td>
                          <td className="px-4 py-3 font-medium text-slate-900">{v.cliente}</td>
                          <td className="px-4 py-3 text-slate-600">{SERVICIO_LABELS[v.servicio]}</td>
                          <td className="px-4 py-3 text-slate-600">{CATEGORIA_LABELS[v.categoria]}</td>
                          <td className="px-4 py-3 text-slate-600">{v.contacto}</td>
                          <td className="px-4 py-3 font-medium text-slate-800">{formatMXN(v.montoNeto)}</td>
                          <td className="px-4 py-3 font-semibold text-[#1E3A5F]">{formatMXN(v.montoTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
