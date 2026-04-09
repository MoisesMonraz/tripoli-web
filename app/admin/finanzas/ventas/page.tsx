'use client';

import { useCallback, useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../../../../lib/firebase/client';
import {
  CATEGORIAS,
  CATEGORIA_LABELS,
  CONTACTOS,
  SERVICIOS,
  SERVICIO_LABELS,
  formatMXN,
  formatDate,
} from '../../../../lib/finanzas';
import type { Categoria, Distribucion, Servicio, Venta } from '../../../../types/finanzas';

function FinanzasNav() {
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
            l.href === '/admin/finanzas/ventas'
              ? 'bg-[#1E3A5F] text-white'
              : 'border border-slate-200 text-slate-600 hover:border-[#1E3A5F] hover:text-[#1E3A5F]'
          }`}
        >
          {l.label}
        </a>
      ))}
      <a href="/admin" className="ml-auto text-xs text-slate-400 hover:text-slate-600 transition">← Admin</a>
    </div>
  );
}

function DistribucionDetail({ d }: { d: Distribucion }) {
  const [showAccionistas, setShowAccionistas] = useState(false);
  return (
    <div className="px-4 py-4 bg-slate-50 border-t border-slate-200">
      <div className="max-w-2xl">
        <div className="flex gap-6 mb-3 text-sm">
          <span className="text-slate-500">Neto: <span className="font-semibold text-slate-800">{formatMXN(d.subtotalNeto)}</span></span>
          <span className="text-slate-500">IVA: <span className="font-medium">{formatMXN(d.iva)}</span></span>
          <span className="text-slate-500">Total: <span className="font-bold text-[#1E3A5F]">{formatMXN(d.totalConIva)}</span></span>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="pb-1.5">Concepto</th>
              <th className="pb-1.5">Destinatario</th>
              <th className="pb-1.5 text-right">%</th>
              <th className="pb-1.5 text-right">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="py-1.5 text-slate-600">Prestador</td>
              <td className="py-1.5 font-medium">{d.prestador.nombre}</td>
              <td className="py-1.5 text-right text-slate-400">70%</td>
              <td className="py-1.5 text-right font-semibold">{formatMXN(d.prestador.monto)}</td>
            </tr>
            <tr>
              <td className="py-1.5 text-slate-600">Contacto</td>
              <td className="py-1.5 font-medium">{d.contacto.nombre}</td>
              <td className="py-1.5 text-right text-slate-400">12.5%</td>
              <td className="py-1.5 text-right font-semibold">{formatMXN(d.contacto.monto)}</td>
            </tr>
            <tr>
              <td className="py-1.5">
                <button
                  type="button"
                  onClick={() => setShowAccionistas((v) => !v)}
                  className="text-slate-600 hover:text-[#1E3A5F] flex items-center gap-1"
                >
                  Accionistas TM <span className="text-[9px]">{showAccionistas ? '▲' : '▼'}</span>
                </button>
              </td>
              <td className="py-1.5 text-slate-400">9 accionistas</td>
              <td className="py-1.5 text-right text-slate-400">10%</td>
              <td className="py-1.5 text-right font-semibold">
                {formatMXN(d.accionistas.reduce((s, a) => s + a.monto, 0))}
              </td>
            </tr>
            {showAccionistas &&
              d.accionistas.map((a) => (
                <tr key={a.nombre} className="bg-slate-100/60">
                  <td className="py-1 pl-3 text-slate-500">{a.nombre}</td>
                  <td></td>
                  <td className="py-1 text-right text-slate-400">{a.porcentaje.toFixed(2)}%</td>
                  <td className="py-1 text-right text-slate-600">{formatMXN(a.monto)}</td>
                </tr>
              ))}
            <tr>
              <td className="py-1.5 text-slate-600">Inversión TM</td>
              <td className="py-1.5 text-slate-400">Tripoli Media</td>
              <td className="py-1.5 text-right text-slate-400">5%</td>
              <td className="py-1.5 text-right font-semibold">{formatMXN(d.inversionTM)}</td>
            </tr>
            <tr>
              <td className="py-1.5 text-slate-600">Coordinador</td>
              <td className="py-1.5 font-medium">{d.coordinador.nombre}</td>
              <td className="py-1.5 text-right text-slate-400">2.5%</td>
              <td className="py-1.5 text-right font-semibold">{formatMXN(d.coordinador.monto)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function VentasPage() {
  const [isChecking, setIsChecking] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const [filterFechaInicio, setFilterFechaInicio] = useState('');
  const [filterFechaFin, setFilterFechaFin] = useState('');
  const [filterServicio, setFilterServicio] = useState<Servicio | ''>('');
  const [filterCategoria, setFilterCategoria] = useState<Categoria | ''>('');
  const [filterContacto, setFilterContacto] = useState('');

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
    if (!db) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'ventas'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setVentas(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Venta)));
    } catch { /* no-op */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);
  useEffect(() => { if (session?.ok) fetchVentas(); }, [session, fetchVentas]);

  const filtered = ventas.filter((v) => {
    if (filterFechaInicio && v.fechaEmision < filterFechaInicio) return false;
    if (filterFechaFin && v.fechaEmision > filterFechaFin) return false;
    if (filterServicio && v.servicio !== filterServicio) return false;
    if (filterCategoria && v.categoria !== filterCategoria) return false;
    if (filterContacto && v.contacto !== filterContacto) return false;
    return true;
  });

  const totalNeto = filtered.reduce((s, v) => s + v.montoNeto, 0);
  const totalIva = filtered.reduce((s, v) => s + v.iva, 0);
  const totalConIva = filtered.reduce((s, v) => s + v.montoTotal, 0);

  const exportCSV = () => {
    const headers = ['Fecha', 'Cliente', 'Servicio', 'Categoría', 'Contacto', 'Monto Neto', 'IVA', 'Total', 'Prestador', 'Coordinador'];
    const rows = filtered.map((v) => [
      v.fechaEmision,
      `"${v.cliente}"`,
      SERVICIO_LABELS[v.servicio],
      CATEGORIA_LABELS[v.categoria],
      v.contacto,
      v.montoNeto,
      v.iva,
      v.montoTotal,
      v.prestadorServicio,
      v.coordinadorCategoria,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ventas-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl flex flex-col gap-6">

        <header className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-semibold mb-1">Finanzas</p>
              <h1 className="text-2xl font-bold text-slate-900">Ventas</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportCSV}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition"
              >
                Exportar CSV
              </button>
              <a
                href="/admin/finanzas/nueva-venta"
                className="rounded-lg bg-[#1E3A5F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#162d4a] transition"
              >
                + Nueva venta
              </a>
            </div>
          </div>
          <FinanzasNav />
        </header>

        {/* Filters */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Desde</label>
              <input type="date" value={filterFechaInicio} onChange={(e) => setFilterFechaInicio(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Hasta</label>
              <input type="date" value={filterFechaFin} onChange={(e) => setFilterFechaFin(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Servicio</label>
              <select value={filterServicio} onChange={(e) => setFilterServicio(e.target.value as Servicio | '')}
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]">
                <option value="">Todos</option>
                {SERVICIOS.map((s) => <option key={s} value={s}>{SERVICIO_LABELS[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Categoría</label>
              <select value={filterCategoria} onChange={(e) => setFilterCategoria(e.target.value as Categoria | '')}
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]">
                <option value="">Todas</option>
                {CATEGORIAS.map((c) => <option key={c} value={c}>{CATEGORIA_LABELS[c]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Contacto</label>
              <select value={filterContacto} onChange={(e) => setFilterContacto(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]">
                <option value="">Todos</option>
                {CONTACTOS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          {(filterFechaInicio || filterFechaFin || filterServicio || filterCategoria || filterContacto) && (
            <button
              onClick={() => { setFilterFechaInicio(''); setFilterFechaFin(''); setFilterServicio(''); setFilterCategoria(''); setFilterContacto(''); }}
              className="mt-3 text-xs text-slate-400 hover:text-rose-500 transition"
            >
              Limpiar filtros
            </button>
          )}
        </section>

        {/* Table */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">
              {filtered.length} {filtered.length === 1 ? 'venta' : 'ventas'} {ventas.length !== filtered.length ? `(de ${ventas.length} total)` : ''}
            </h2>
            <span className="text-xs text-slate-500">Clic en una fila para ver distribución</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">Cargando ventas...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              {ventas.length === 0 ? (
                <>No hay ventas registradas. <a href="/admin/finanzas/nueva-venta" className="text-[#1E3A5F] hover:underline">Registrar primera venta</a></>
              ) : 'No hay ventas con los filtros seleccionados.'}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      {['Fecha', 'Cliente', 'Servicio', 'Categoría', 'Contacto', 'Monto Neto', 'IVA', 'Total'].map((h) => (
                        <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {filtered.map((v) => (
                      <>
                        <tr
                          key={v.id}
                          onClick={() => setExpandedRow(expandedRow === v.id ? null : (v.id ?? null))}
                          className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                        >
                          <td className="px-4 py-3 whitespace-nowrap text-slate-600">{formatDate(v.fechaEmision)}</td>
                          <td className="px-4 py-3 font-medium text-slate-900 max-w-[160px] truncate">{v.cliente}</td>
                          <td className="px-4 py-3 text-slate-600">{SERVICIO_LABELS[v.servicio]}</td>
                          <td className="px-4 py-3 text-slate-600">{CATEGORIA_LABELS[v.categoria]}</td>
                          <td className="px-4 py-3 text-slate-600">{v.contacto}</td>
                          <td className="px-4 py-3 font-medium text-slate-800">{formatMXN(v.montoNeto)}</td>
                          <td className="px-4 py-3 text-slate-500">{formatMXN(v.iva)}</td>
                          <td className="px-4 py-3 font-semibold text-[#1E3A5F]">{formatMXN(v.montoTotal)}</td>
                        </tr>
                        {expandedRow === v.id && v.distribucion && (
                          <tr key={`${v.id}-detail`}>
                            <td colSpan={8} className="p-0">
                              <DistribucionDetail d={v.distribucion} />
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                    <tr>
                      <td className="px-4 py-3 text-xs font-bold uppercase text-slate-600" colSpan={5}>
                        Totales ({filtered.length} ventas)
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-800">{formatMXN(totalNeto)}</td>
                      <td className="px-4 py-3 font-bold text-slate-600">{formatMXN(totalIva)}</td>
                      <td className="px-4 py-3 font-bold text-[#1E3A5F]">{formatMXN(totalConIva)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
