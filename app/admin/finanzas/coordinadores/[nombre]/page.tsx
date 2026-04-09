'use client';

import { useCallback, useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../../../../../lib/firebase/client';
import {
  ACCIONISTAS_SEED,
  CATEGORIA_LABELS,
  SERVICIO_LABELS,
  formatMXN,
  formatDate,
} from '../../../../../lib/finanzas';
import type { Venta } from '../../../../../types/finanzas';

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
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:border-[#1E3A5F] hover:text-[#1E3A5F] transition"
        >
          {l.label}
        </a>
      ))}
      <a href="/admin" className="ml-auto text-xs text-slate-400 hover:text-slate-600 transition">← Admin</a>
    </div>
  );
}

export default function CoordinadorPage({ params }: { params: { nombre: string } }) {
  const nombre = decodeURIComponent(params.nombre);
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

  const accionista = ACCIONISTAS_SEED.find((a) => a.nombre === nombre);
  const rolLabel = accionista?.rol ?? 'Colaborador';

  // Ventas where this person appears in any role
  const ventasRelacionadas = ventas.filter((v) => {
    const d = v.distribucion;
    if (!d) return false;
    return (
      d.prestador?.nombre === nombre ||
      d.contacto?.nombre === nombre ||
      d.coordinador?.nombre === nombre ||
      d.accionistas?.some((a) => a.nombre === nombre)
    );
  });

  // Role totals
  const totalPrestador = ventasRelacionadas.reduce((s, v) => {
    return s + (v.distribucion.prestador?.nombre === nombre ? v.distribucion.prestador.monto : 0);
  }, 0);
  const totalContacto = ventasRelacionadas.reduce((s, v) => {
    return s + (v.distribucion.contacto?.nombre === nombre ? v.distribucion.contacto.monto : 0);
  }, 0);
  const totalCoordinador = ventasRelacionadas.reduce((s, v) => {
    return s + (v.distribucion.coordinador?.nombre === nombre ? v.distribucion.coordinador.monto : 0);
  }, 0);
  const totalAccionista = ventasRelacionadas.reduce((s, v) => {
    const share = v.distribucion.accionistas?.find((a) => a.nombre === nombre);
    return s + (share?.monto ?? 0);
  }, 0);
  const totalCombinado = totalPrestador + totalContacto + totalCoordinador + totalAccionista;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl flex flex-col gap-6">

        <header className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-semibold mb-1">Finanzas / Coordinadores</p>
            <h1 className="text-2xl font-bold text-slate-900">{nombre}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{rolLabel}</p>
          </div>
          <FinanzasNav />
        </header>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { label: 'Ventas relacionadas', value: ventasRelacionadas.length.toString() },
            { label: 'Como Prestador', value: formatMXN(totalPrestador) },
            { label: 'Como Contacto', value: formatMXN(totalContacto) },
            { label: 'Como Coordinador', value: formatMXN(totalCoordinador) },
            { label: 'Como Accionista', value: formatMXN(totalAccionista) },
          ].map((c) => (
            <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500 mb-1">{c.label}</p>
              <p className="text-lg font-bold text-[#1E3A5F] break-all">{c.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border-2 border-[#1E3A5F] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Total combinado</p>
            <p className="text-2xl font-bold text-[#1E3A5F]">{formatMXN(totalCombinado)}</p>
          </div>
          {accionista && (
            <p className="text-xs text-slate-400 mt-1">{accionista.porcentajeAcciones}% de acciones en Tripoli Media</p>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-slate-500">Cargando datos...</div>
        ) : (
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-4">
              <h2 className="text-sm font-semibold text-slate-800">
                Detalle de ventas ({ventasRelacionadas.length})
              </h2>
            </div>
            {ventasRelacionadas.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500">
                No hay ventas relacionadas con {nombre}.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      {['Fecha', 'Cliente', 'Categoría', 'Servicio', 'Monto Neto', 'Prestador', 'Contacto', 'Coordinador', 'Accionista', 'Total'].map((h) => (
                        <th key={h} className="px-3 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {ventasRelacionadas.map((v) => {
                      const d = v.distribucion;
                      const esPrestador = d.prestador?.nombre === nombre ? d.prestador.monto : 0;
                      const esContacto = d.contacto?.nombre === nombre ? d.contacto.monto : 0;
                      const esCoordinador = d.coordinador?.nombre === nombre ? d.coordinador.monto : 0;
                      const esAccionista = d.accionistas?.find((a) => a.nombre === nombre)?.monto ?? 0;
                      const ventaTotal = esPrestador + esContacto + esCoordinador + esAccionista;
                      return (
                        <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-3 py-3 whitespace-nowrap text-slate-600">{formatDate(v.fechaEmision)}</td>
                          <td className="px-3 py-3 font-medium text-slate-900 max-w-[120px] truncate">{v.cliente}</td>
                          <td className="px-3 py-3 text-slate-600 whitespace-nowrap">{CATEGORIA_LABELS[v.categoria]}</td>
                          <td className="px-3 py-3 text-slate-600 whitespace-nowrap">{SERVICIO_LABELS[v.servicio]}</td>
                          <td className="px-3 py-3 text-slate-800 font-medium whitespace-nowrap">{formatMXN(v.montoNeto)}</td>
                          <td className="px-3 py-3 text-right whitespace-nowrap">
                            {esPrestador > 0 ? <span className="font-medium text-[#1E3A5F]">{formatMXN(esPrestador)}</span> : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-3 py-3 text-right whitespace-nowrap">
                            {esContacto > 0 ? <span className="font-medium text-[#1E3A5F]">{formatMXN(esContacto)}</span> : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-3 py-3 text-right whitespace-nowrap">
                            {esCoordinador > 0 ? <span className="font-medium text-[#1E3A5F]">{formatMXN(esCoordinador)}</span> : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-3 py-3 text-right whitespace-nowrap">
                            {esAccionista > 0 ? <span className="font-medium text-[#1E3A5F]">{formatMXN(esAccionista)}</span> : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-3 py-3 text-right whitespace-nowrap font-bold text-[#1E3A5F]">
                            {formatMXN(ventaTotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                    <tr>
                      <td className="px-3 py-3 text-xs font-bold uppercase text-slate-600" colSpan={5}>
                        Totales
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-[#1E3A5F]">{totalPrestador > 0 ? formatMXN(totalPrestador) : '—'}</td>
                      <td className="px-3 py-3 text-right font-bold text-[#1E3A5F]">{totalContacto > 0 ? formatMXN(totalContacto) : '—'}</td>
                      <td className="px-3 py-3 text-right font-bold text-[#1E3A5F]">{totalCoordinador > 0 ? formatMXN(totalCoordinador) : '—'}</td>
                      <td className="px-3 py-3 text-right font-bold text-[#1E3A5F]">{totalAccionista > 0 ? formatMXN(totalAccionista) : '—'}</td>
                      <td className="px-3 py-3 text-right font-bold text-[#1E3A5F]">{formatMXN(totalCombinado)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </section>
        )}

        <div className="flex gap-3">
          <a href="/admin/finanzas/accionistas" className="text-sm text-[#1E3A5F] hover:underline">← Volver a accionistas</a>
          <a href="/admin/finanzas" className="text-sm text-slate-400 hover:text-slate-600">Dashboard</a>
        </div>
      </div>
    </main>
  );
}
