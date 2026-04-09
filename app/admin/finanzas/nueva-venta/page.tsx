'use client';

import { useCallback, useEffect, useState } from 'react';
import { createVenta } from '../../../../lib/actions/finanzas-actions';
import {
  CATEGORIAS,
  CATEGORIA_LABELS,
  CONTACTOS,
  SERVICIOS,
  SERVICIO_LABELS,
  calculateDistribution,
  getPrestador,
  getCoordinador,
  formatMXN,
} from '../../../../lib/finanzas';
import type { Categoria, Distribucion, Servicio } from '../../../../types/finanzas';

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
            l.href === '/admin/finanzas/nueva-venta'
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

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

type FormState = {
  cliente: string;
  fechaEmision: string;
  servicio: Servicio | '';
  categoria: Categoria | '';
  contacto: string;
  montoNeto: string;
};

export default function NuevaVentaPage() {
  const [isChecking, setIsChecking] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [form, setForm] = useState<FormState>({
    cliente: '',
    fechaEmision: todayStr(),
    servicio: '',
    categoria: '',
    contacto: '',
    montoNeto: '',
  });
  const [showAccionistas, setShowAccionistas] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [savedId, setSavedId] = useState<string | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<Distribucion | null>(null);

  const fetchStatus = useCallback(async () => {
    setIsChecking(true);
    try {
      const res = await fetch('/api/admin/status');
      if (!res.ok) { setSession(null); return; }
      setSession(await res.json());
    } catch { setSession(null); }
    finally { setIsChecking(false); }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const montoNeto = parseFloat(form.montoNeto) || 0;
  const distribution: Distribucion | null =
    form.servicio && form.categoria && form.contacto && montoNeto > 0
      ? calculateDistribution(montoNeto, form.servicio as Servicio, form.categoria as Categoria, form.contacto)
      : null;

  const prestador = form.servicio ? getPrestador(form.servicio as Servicio) : null;
  const coordinador = form.categoria ? getCoordinador(form.categoria as Categoria) : null;

  const personSubtotals: Record<string, number> = {};
  if (distribution) {
    const add = (n: string, m: number) => { personSubtotals[n] = (personSubtotals[n] || 0) + m; };
    add(distribution.prestador.nombre, distribution.prestador.monto);
    add(distribution.contacto.nombre, distribution.contacto.monto);
    add(distribution.coordinador.nombre, distribution.coordinador.monto);
    distribution.accionistas.forEach((a) => add(a.nombre, a.monto));
  }

  const hasMultiRole = distribution
    ? Object.entries(personSubtotals).some(([n]) => {
        const roles = [distribution.prestador.nombre, distribution.contacto.nombre, distribution.coordinador.nombre];
        const inRoles = roles.filter((r) => r === n).length;
        const inAccionistas = distribution.accionistas.some((a) => a.nombre === n);
        return inRoles > 1 || (inRoles >= 1 && inAccionistas);
      })
    : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.servicio || !form.categoria || !form.contacto || montoNeto <= 0) {
      setError('Completa todos los campos correctamente.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const result = await createVenta({
        cliente: form.cliente,
        fechaEmision: form.fechaEmision,
        servicio: form.servicio as Servicio,
        categoria: form.categoria as Categoria,
        contacto: form.contacto,
        montoNeto,
      });
      if (!result.ok) {
        setError(result.error ?? 'Error al guardar. Intenta de nuevo.');
        return;
      }
      setSavedId(result.id ?? null);
      setSavedSnapshot(distribution);
    } catch {
      setError('Error al guardar. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSavedId(null);
    setSavedSnapshot(null);
    setForm({ cliente: '', fechaEmision: todayStr(), servicio: '', categoria: '', contacto: '', montoNeto: '' });
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

  if (savedId && savedSnapshot) {
    const d = savedSnapshot;
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl flex flex-col gap-6">
          <header className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">Venta registrada exitosamente</h1>
                <p className="text-sm text-slate-500">{form.cliente} — {form.fechaEmision}</p>
              </div>
            </div>
          </header>

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-4">
              <h2 className="text-sm font-semibold text-slate-800">Distribución de ingresos</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Monto neto</span>
                <span className="font-semibold">{formatMXN(d.subtotalNeto)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">IVA 16%</span>
                <span className="font-medium">{formatMXN(d.iva)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-slate-200 pt-3">
                <span>Total con IVA</span>
                <span className="text-[#1E3A5F]">{formatMXN(d.totalConIva)}</span>
              </div>
              <div className="border-t border-slate-200 pt-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                      <th className="pb-2">Concepto</th>
                      <th className="pb-2">Destinatario</th>
                      <th className="pb-2 text-right">%</th>
                      <th className="pb-2 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr><td className="py-2 text-slate-600">Prestador del Servicio</td><td className="py-2 font-medium">{d.prestador.nombre}</td><td className="py-2 text-right text-slate-500">70%</td><td className="py-2 text-right font-semibold">{formatMXN(d.prestador.monto)}</td></tr>
                    <tr><td className="py-2 text-slate-600">Contacto</td><td className="py-2 font-medium">{d.contacto.nombre}</td><td className="py-2 text-right text-slate-500">12.5%</td><td className="py-2 text-right font-semibold">{formatMXN(d.contacto.monto)}</td></tr>
                    <tr><td className="py-2 text-slate-600">Accionistas TM</td><td className="py-2 text-slate-500 text-xs">9 accionistas</td><td className="py-2 text-right text-slate-500">10%</td><td className="py-2 text-right font-semibold">{formatMXN(d.accionistas.reduce((s, a) => s + a.monto, 0))}</td></tr>
                    <tr><td className="py-2 text-slate-600">Inversión TM</td><td className="py-2 text-slate-500">Tripoli Media</td><td className="py-2 text-right text-slate-500">5%</td><td className="py-2 text-right font-semibold">{formatMXN(d.inversionTM)}</td></tr>
                    <tr><td className="py-2 text-slate-600">Coordinador de Sección</td><td className="py-2 font-medium">{d.coordinador.nombre}</td><td className="py-2 text-right text-slate-500">2.5%</td><td className="py-2 text-right font-semibold">{formatMXN(d.coordinador.monto)}</td></tr>
                    <tr className="border-t-2 border-slate-200 font-bold"><td className="pt-3">TOTAL</td><td></td><td className="pt-3 text-right">100%</td><td className="pt-3 text-right text-[#1E3A5F]">{formatMXN(d.subtotalNeto)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <div className="flex gap-3 flex-wrap">
            <button onClick={handleReset} className="rounded-lg bg-[#1E3A5F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#162d4a] transition">
              Registrar otra venta
            </button>
            <a href="/admin/finanzas/ventas" className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
              Ver todas las ventas
            </a>
            <a href="/admin/finanzas" className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
              Dashboard
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl flex flex-col gap-6">
        <header className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-semibold mb-1">Finanzas</p>
            <h1 className="text-2xl font-bold text-slate-900">Registrar Nueva Venta</h1>
          </div>
          <FinanzasNav />
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-4">
              <h2 className="text-sm font-semibold text-slate-800">Datos de la venta</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Cliente *</label>
                <input type="text" required value={form.cliente} onChange={(e) => setForm((f) => ({ ...f, cliente: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent"
                  placeholder="Nombre del cliente" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Fecha de emisión *</label>
                <input type="date" required value={form.fechaEmision} onChange={(e) => setForm((f) => ({ ...f, fechaEmision: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Servicio *</label>
                <select required value={form.servicio} onChange={(e) => setForm((f) => ({ ...f, servicio: e.target.value as Servicio }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent">
                  <option value="">Selecciona un servicio</option>
                  {SERVICIOS.map((s) => <option key={s} value={s}>{SERVICIO_LABELS[s]}</option>)}
                </select>
                {prestador && <p className="mt-1.5 text-xs text-slate-500">Prestador: <span className="font-semibold text-slate-700">{prestador}</span></p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Categoría *</label>
                <select required value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value as Categoria }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent">
                  <option value="">Selecciona una categoría</option>
                  {CATEGORIAS.map((c) => <option key={c} value={c}>{CATEGORIA_LABELS[c]}</option>)}
                </select>
                {coordinador && <p className="mt-1.5 text-xs text-slate-500">Coordinador: <span className="font-semibold text-slate-700">{coordinador}</span></p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Contacto *</label>
                <select required value={form.contacto} onChange={(e) => setForm((f) => ({ ...f, contacto: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent">
                  <option value="">Selecciona un contacto</option>
                  {CONTACTOS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Monto neto (sin IVA) *</label>
                <input type="number" required min={1} step="0.01" value={form.montoNeto} onChange={(e) => setForm((f) => ({ ...f, montoNeto: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent"
                  placeholder="10000" />
              </div>

              {error && <p className="text-sm font-semibold text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-100">{error}</p>}

              <button type="submit" disabled={submitting}
                className="w-full rounded-lg bg-[#1E3A5F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#162d4a] transition disabled:opacity-60 disabled:cursor-not-allowed">
                {submitting ? 'Registrando...' : 'Registrar venta'}
              </button>
            </form>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-4">
              <h2 className="text-sm font-semibold text-slate-800">Vista previa de distribución</h2>
            </div>
            {!distribution ? (
              <div className="p-6 text-center text-sm text-slate-400">
                Completa el formulario para ver la distribución de ingresos.
              </div>
            ) : (
              <div className="p-6">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm"><span className="text-slate-600">Monto neto</span><span className="font-semibold">{formatMXN(distribution.subtotalNeto)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-600">IVA 16%</span><span className="font-medium">{formatMXN(distribution.iva)}</span></div>
                  <div className="flex justify-between text-sm font-bold border-t border-slate-200 pt-2"><span>Total con IVA</span><span className="text-[#1E3A5F]">{formatMXN(distribution.totalConIva)}</span></div>
                </div>

                <div className="border-t border-slate-200 pt-4 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="text-left text-slate-500 border-b border-slate-100">
                      <th className="pb-2">Concepto</th><th className="pb-2">Destinatario</th><th className="pb-2 text-right">%</th><th className="pb-2 text-right">Monto</th>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr><td className="py-2 text-slate-600">Prestador</td><td className="py-2 font-medium">{distribution.prestador.nombre}</td><td className="py-2 text-right text-slate-400">70%</td><td className="py-2 text-right font-semibold">{formatMXN(distribution.prestador.monto)}</td></tr>
                      <tr><td className="py-2 text-slate-600">Contacto</td><td className="py-2 font-medium">{distribution.contacto.nombre}</td><td className="py-2 text-right text-slate-400">12.5%</td><td className="py-2 text-right font-semibold">{formatMXN(distribution.contacto.monto)}</td></tr>
                      <tr>
                        <td className="py-2">
                          <button type="button" onClick={() => setShowAccionistas((v) => !v)} className="text-slate-600 hover:text-[#1E3A5F] flex items-center gap-1">
                            Accionistas TM <span className="text-[9px]">{showAccionistas ? '▲' : '▼'}</span>
                          </button>
                        </td>
                        <td className="py-2 text-slate-400">9 accionistas</td>
                        <td className="py-2 text-right text-slate-400">10%</td>
                        <td className="py-2 text-right font-semibold">{formatMXN(distribution.accionistas.reduce((s, a) => s + a.monto, 0))}</td>
                      </tr>
                      {showAccionistas && distribution.accionistas.map((a) => (
                        <tr key={a.nombre} className="bg-slate-50/70">
                          <td className="py-1.5 pl-4 text-slate-500">{a.nombre}</td><td></td>
                          <td className="py-1.5 text-right text-slate-400">{a.porcentaje.toFixed(2)}%</td>
                          <td className="py-1.5 text-right text-slate-600">{formatMXN(a.monto)}</td>
                        </tr>
                      ))}
                      <tr><td className="py-2 text-slate-600">Inversión TM</td><td className="py-2 text-slate-400">Tripoli Media</td><td className="py-2 text-right text-slate-400">5%</td><td className="py-2 text-right font-semibold">{formatMXN(distribution.inversionTM)}</td></tr>
                      <tr><td className="py-2 text-slate-600">Coordinador</td><td className="py-2 font-medium">{distribution.coordinador.nombre}</td><td className="py-2 text-right text-slate-400">2.5%</td><td className="py-2 text-right font-semibold">{formatMXN(distribution.coordinador.monto)}</td></tr>
                      <tr className="border-t-2 border-slate-200 font-bold">
                        <td className="pt-2">TOTAL</td><td></td><td className="pt-2 text-right">100%</td><td className="pt-2 text-right text-[#1E3A5F]">{formatMXN(distribution.subtotalNeto)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {hasMultiRole && (
                  <div className="border-t border-slate-200 pt-4 mt-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Subtotales combinados</p>
                    {Object.entries(personSubtotals).map(([nombre, total]) => (
                      <div key={nombre} className="flex justify-between text-xs py-1">
                        <span className="text-slate-700">{nombre}</span>
                        <span className="font-semibold text-[#1E3A5F]">{formatMXN(total)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
