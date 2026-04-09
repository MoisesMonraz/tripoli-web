'use client';

import { useCallback, useEffect, useState } from 'react';
import { getVentas, updateVenta, deleteVenta } from '../../../../lib/actions/finanzas-actions';
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
  formatDate,
} from '../../../../lib/finanzas';
import type { Categoria, Distribucion, Servicio, Venta } from '../../../../types/finanzas';

const OWNER_EMAIL = 'monrazescoto@gmail.com';

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
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${l.href === '/admin/finanzas/ventas' ? 'bg-[#1E3A5F] text-white' : 'border border-slate-200 text-slate-600 hover:border-[#1E3A5F] hover:text-[#1E3A5F]'}`}>
          {l.label}
        </a>
      ))}
    </div>
  );
}

function DistribucionDetail({ d }: { d: Distribucion }) {
  const [showAcc, setShowAcc] = useState(false);
  return (
    <div className="px-4 py-4 bg-slate-50 border-t border-slate-200">
      <div className="max-w-2xl">
        <div className="flex gap-6 mb-3 text-sm">
          <span className="text-slate-500">Neto: <span className="font-semibold text-slate-800">{formatMXN(d.subtotalNeto)}</span></span>
          <span className="text-slate-500">IVA: <span className="font-medium">{formatMXN(d.iva)}</span></span>
          <span className="text-slate-500">Total: <span className="font-bold text-[#1E3A5F]">{formatMXN(d.totalConIva)}</span></span>
        </div>
        <table className="w-full text-xs">
          <thead><tr className="text-left text-slate-500 border-b border-slate-200">
            <th className="pb-1.5">Concepto</th><th className="pb-1.5">Destinatario</th><th className="pb-1.5 text-right">%</th><th className="pb-1.5 text-right">Monto</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            <tr><td className="py-1.5 text-slate-600">Prestador</td><td className="py-1.5 font-medium">{d.prestador.nombre}</td><td className="py-1.5 text-right text-slate-400">70%</td><td className="py-1.5 text-right font-semibold">{formatMXN(d.prestador.monto)}</td></tr>
            <tr><td className="py-1.5 text-slate-600">Contacto</td><td className="py-1.5 font-medium">{d.contacto.nombre}</td><td className="py-1.5 text-right text-slate-400">12.5%</td><td className="py-1.5 text-right font-semibold">{formatMXN(d.contacto.monto)}</td></tr>
            <tr>
              <td className="py-1.5">
                <button type="button" onClick={() => setShowAcc((v) => !v)} className="text-slate-600 hover:text-[#1E3A5F] flex items-center gap-1">
                  Accionistas TM <span className="text-[9px]">{showAcc ? '▲' : '▼'}</span>
                </button>
              </td>
              <td className="py-1.5 text-slate-400">9 accionistas</td>
              <td className="py-1.5 text-right text-slate-400">10%</td>
              <td className="py-1.5 text-right font-semibold">{formatMXN(d.accionistas.reduce((s, a) => s + a.monto, 0))}</td>
            </tr>
            {showAcc && d.accionistas.map((a) => (
              <tr key={a.nombre} className="bg-slate-100/60">
                <td className="py-1 pl-3 text-slate-500">{a.nombre}</td><td></td>
                <td className="py-1 text-right text-slate-400">{a.porcentaje.toFixed(2)}%</td>
                <td className="py-1 text-right text-slate-600">{formatMXN(a.monto)}</td>
              </tr>
            ))}
            <tr><td className="py-1.5 text-slate-600">Inversión TM</td><td className="py-1.5 text-slate-400">Tripoli Media</td><td className="py-1.5 text-right text-slate-400">5%</td><td className="py-1.5 text-right font-semibold">{formatMXN(d.inversionTM)}</td></tr>
            <tr><td className="py-1.5 text-slate-600">Coordinador</td><td className="py-1.5 font-medium">{d.coordinador.nombre}</td><td className="py-1.5 text-right text-slate-400">2.5%</td><td className="py-1.5 text-right font-semibold">{formatMXN(d.coordinador.monto)}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

type EditForm = {
  cliente: string;
  fechaEmision: string;
  servicio: Servicio | '';
  categoria: Categoria | '';
  contacto: string;
  montoNeto: string;
};

function EditModal({ venta, onSave, onClose }: { venta: Venta; onSave: () => void; onClose: () => void }) {
  const [form, setForm] = useState<EditForm>({
    cliente: venta.cliente,
    fechaEmision: venta.fechaEmision,
    servicio: venta.servicio,
    categoria: venta.categoria,
    contacto: venta.contacto,
    montoNeto: venta.montoNeto.toString(),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showAcc, setShowAcc] = useState(false);

  const montoNeto = parseFloat(form.montoNeto) || 0;
  const preview: Distribucion | null =
    form.servicio && form.categoria && form.contacto && montoNeto > 0
      ? calculateDistribution(montoNeto, form.servicio as Servicio, form.categoria as Categoria, form.contacto)
      : null;

  const prestador = form.servicio ? getPrestador(form.servicio as Servicio) : null;
  const coordinador = form.categoria ? getCoordinador(form.categoria as Categoria) : null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.servicio || !form.categoria || !form.contacto || montoNeto <= 0) {
      setError('Completa todos los campos correctamente.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const result = await updateVenta(venta.id!, {
        cliente: form.cliente,
        fechaEmision: form.fechaEmision,
        servicio: form.servicio as Servicio,
        categoria: form.categoria as Categoria,
        contacto: form.contacto,
        montoNeto,
      });
      if (!result.ok) { setError(result.error ?? 'Error al guardar.'); return; }
      onSave();
    } catch {
      setError('Error al guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900">Editar venta</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 hover:bg-slate-100 transition text-slate-500">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-0 lg:grid-cols-2">
          {/* Form */}
          <form onSubmit={handleSave} className="p-6 flex flex-col gap-4 border-r border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Cliente *</label>
              <input type="text" required value={form.cliente} onChange={(e) => setForm((f) => ({ ...f, cliente: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent" />
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
                <option value="">Selecciona</option>
                {SERVICIOS.map((s) => <option key={s} value={s}>{SERVICIO_LABELS[s]}</option>)}
              </select>
              {prestador && <p className="mt-1.5 text-xs text-slate-500">Prestador: <span className="font-semibold text-slate-700">{prestador}</span></p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Categoría *</label>
              <select required value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value as Categoria }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent">
                <option value="">Selecciona</option>
                {CATEGORIAS.map((c) => <option key={c} value={c}>{CATEGORIA_LABELS[c]}</option>)}
              </select>
              {coordinador && <p className="mt-1.5 text-xs text-slate-500">Coordinador: <span className="font-semibold text-slate-700">{coordinador}</span></p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Contacto *</label>
              <select required value={form.contacto} onChange={(e) => setForm((f) => ({ ...f, contacto: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent">
                <option value="">Selecciona</option>
                {CONTACTOS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Monto neto (sin IVA) *</label>
              <input type="number" required min={1} step="0.01" value={form.montoNeto} onChange={(e) => setForm((f) => ({ ...f, montoNeto: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent" />
            </div>
            {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-100">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={saving}
                className="flex-1 rounded-lg bg-[#1E3A5F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#162d4a] transition disabled:opacity-60">
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button type="button" onClick={onClose}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
                Cancelar
              </button>
            </div>
          </form>

          {/* Preview */}
          <div className="p-6 bg-slate-50/50">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Vista previa</p>
            {!preview ? (
              <p className="text-sm text-slate-400">Completa el formulario para ver la distribución.</p>
            ) : (
              <>
                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-sm"><span className="text-slate-600">Monto neto</span><span className="font-semibold">{formatMXN(preview.subtotalNeto)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-600">IVA 16%</span><span>{formatMXN(preview.iva)}</span></div>
                  <div className="flex justify-between text-sm font-bold border-t border-slate-200 pt-2"><span>Total con IVA</span><span className="text-[#1E3A5F]">{formatMXN(preview.totalConIva)}</span></div>
                </div>
                <table className="w-full text-xs">
                  <thead><tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="pb-1.5">Concepto</th><th className="pb-1.5">Destinatario</th><th className="pb-1.5 text-right">%</th><th className="pb-1.5 text-right">Monto</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr><td className="py-1.5 text-slate-600">Prestador</td><td className="py-1.5 font-medium">{preview.prestador.nombre}</td><td className="py-1.5 text-right text-slate-400">70%</td><td className="py-1.5 text-right font-semibold">{formatMXN(preview.prestador.monto)}</td></tr>
                    <tr><td className="py-1.5 text-slate-600">Contacto</td><td className="py-1.5 font-medium">{preview.contacto.nombre}</td><td className="py-1.5 text-right text-slate-400">12.5%</td><td className="py-1.5 text-right font-semibold">{formatMXN(preview.contacto.monto)}</td></tr>
                    <tr>
                      <td className="py-1.5">
                        <button type="button" onClick={() => setShowAcc((v) => !v)} className="text-slate-600 hover:text-[#1E3A5F] flex items-center gap-1">
                          Accionistas TM <span className="text-[9px]">{showAcc ? '▲' : '▼'}</span>
                        </button>
                      </td>
                      <td className="py-1.5 text-slate-400">9 accionistas</td>
                      <td className="py-1.5 text-right text-slate-400">10%</td>
                      <td className="py-1.5 text-right font-semibold">{formatMXN(preview.accionistas.reduce((s, a) => s + a.monto, 0))}</td>
                    </tr>
                    {showAcc && preview.accionistas.map((a) => (
                      <tr key={a.nombre} className="bg-slate-100/60">
                        <td className="py-1 pl-3 text-slate-500">{a.nombre}</td><td></td>
                        <td className="py-1 text-right text-slate-400">{a.porcentaje.toFixed(2)}%</td>
                        <td className="py-1 text-right text-slate-600">{formatMXN(a.monto)}</td>
                      </tr>
                    ))}
                    <tr><td className="py-1.5 text-slate-600">Inversión TM</td><td className="py-1.5 text-slate-400">Tripoli Media</td><td className="py-1.5 text-right text-slate-400">5%</td><td className="py-1.5 text-right font-semibold">{formatMXN(preview.inversionTM)}</td></tr>
                    <tr><td className="py-1.5 text-slate-600">Coordinador</td><td className="py-1.5 font-medium">{preview.coordinador.nombre}</td><td className="py-1.5 text-right text-slate-400">2.5%</td><td className="py-1.5 text-right font-semibold">{formatMXN(preview.coordinador.monto)}</td></tr>
                    <tr className="border-t-2 border-slate-200 font-bold">
                      <td className="pt-2">TOTAL</td><td></td><td className="pt-2 text-right">100%</td><td className="pt-2 text-right text-[#1E3A5F]">{formatMXN(preview.subtotalNeto)}</td>
                    </tr>
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
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
  const [editingVenta, setEditingVenta] = useState<Venta | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showNoAccess, setShowNoAccess] = useState(false);

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
    setLoading(true);
    try {
      const result = await getVentas();
      if (result.ok && result.ventas) setVentas(result.ventas);
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
      v.fechaEmision, `"${v.cliente}"`,
      SERVICIO_LABELS[v.servicio], CATEGORIA_LABELS[v.categoria],
      v.contacto, v.montoNeto, v.iva, v.montoTotal,
      v.prestadorServicio, v.coordinadorCategoria,
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

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const result = await deleteVenta(id);
      if (result.ok) {
        setVentas((prev) => prev.filter((v) => v.id !== id));
        setDeleteConfirm(null);
        setExpandedRow(null);
      }
    } catch { /* no-op */ }
    finally { setDeletingId(null); }
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
      {/* No-access modal */}
      {showNoAccess && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowNoAccess(false)} />
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
            <p className="text-base font-semibold text-slate-700 mb-5">
              Lo sentimos, actualmente no tienes autorización para acceder a esta sección.
            </p>
            <button onClick={() => setShowNoAccess(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-[#1E3A5F] hover:text-[#1E3A5F] transition">
              Regresar
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl flex flex-col gap-6">

        {/* Edit modal */}
        {editingVenta && (
          <EditModal
            venta={editingVenta}
            onClose={() => setEditingVenta(null)}
            onSave={async () => {
              setEditingVenta(null);
              await fetchVentas();
            }}
          />
        )}

        {/* Delete confirmation modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
            <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
              <h3 className="text-base font-bold text-slate-900 mb-2">¿Eliminar venta?</h3>
              <p className="text-sm text-slate-500 mb-5">
                Esta acción no se puede deshacer. La venta y su distribución serán eliminadas permanentemente.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={deletingId === deleteConfirm}
                  className="flex-1 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 transition disabled:opacity-60"
                >
                  {deletingId === deleteConfirm ? 'Eliminando...' : 'Eliminar'}
                </button>
                <button onClick={() => setDeleteConfirm(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        <header className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-semibold mb-1">Finanzas</p>
              <h1 className="text-2xl font-bold text-slate-900">Ventas</h1>
            </div>
            <a href="/admin" className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:border-[#1E3A5F] hover:text-[#1E3A5F] transition shrink-0">
              Volver a Administración
            </a>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <FinanzasNav />
            {session?.email === OWNER_EMAIL && (
              <div className="flex gap-2 ml-auto">
                <button onClick={exportCSV} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:border-[#1E3A5F] hover:text-[#1E3A5F] transition">
                  Exportar CSV
                </button>
                <a href="/admin/finanzas/nueva-venta" className="rounded-lg bg-[#1E3A5F] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#162d4a] transition">
                  + Nueva venta
                </a>
              </div>
            )}
          </div>
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
            <button onClick={() => { setFilterFechaInicio(''); setFilterFechaFin(''); setFilterServicio(''); setFilterCategoria(''); setFilterContacto(''); }}
              className="mt-3 text-xs text-slate-400 hover:text-rose-500 transition">Limpiar filtros</button>
          )}
        </section>

        {/* Table */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">
              {filtered.length} {filtered.length === 1 ? 'venta' : 'ventas'} {ventas.length !== filtered.length ? `(de ${ventas.length} total)` : ''}
            </h2>
            <span className="text-xs text-slate-400">Clic en una fila para ver distribución</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">Cargando ventas...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              {ventas.length === 0 ? (
                <>No hay ventas. <a href="/admin/finanzas/nueva-venta" className="text-[#1E3A5F] hover:underline">Registrar primera venta</a></>
              ) : 'No hay ventas con los filtros seleccionados.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    {['Fecha', 'Cliente', 'Servicio', 'Categoría', 'Contacto', 'Neto', 'IVA', 'Total', 'Acciones'].map((h) => (
                      <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filtered.map((v) => (
                    <>
                      <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-slate-600 cursor-pointer" onClick={() => setExpandedRow(expandedRow === v.id ? null : (v.id ?? null))}>{formatDate(v.fechaEmision)}</td>
                        <td className="px-4 py-3 font-medium text-slate-900 max-w-[140px] truncate cursor-pointer" onClick={() => setExpandedRow(expandedRow === v.id ? null : (v.id ?? null))}>{v.cliente}</td>
                        <td className="px-4 py-3 text-slate-600 cursor-pointer" onClick={() => setExpandedRow(expandedRow === v.id ? null : (v.id ?? null))}>{SERVICIO_LABELS[v.servicio]}</td>
                        <td className="px-4 py-3 text-slate-600 cursor-pointer" onClick={() => setExpandedRow(expandedRow === v.id ? null : (v.id ?? null))}>{CATEGORIA_LABELS[v.categoria]}</td>
                        <td className="px-4 py-3 text-slate-600 cursor-pointer" onClick={() => setExpandedRow(expandedRow === v.id ? null : (v.id ?? null))}>{v.contacto}</td>
                        <td className="px-4 py-3 font-medium text-slate-800 cursor-pointer" onClick={() => setExpandedRow(expandedRow === v.id ? null : (v.id ?? null))}>{formatMXN(v.montoNeto)}</td>
                        <td className="px-4 py-3 text-slate-500 cursor-pointer" onClick={() => setExpandedRow(expandedRow === v.id ? null : (v.id ?? null))}>{formatMXN(v.iva)}</td>
                        <td className="px-4 py-3 font-semibold text-[#1E3A5F] cursor-pointer" onClick={() => setExpandedRow(expandedRow === v.id ? null : (v.id ?? null))}>{formatMXN(v.montoTotal)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => session?.email === OWNER_EMAIL ? setEditingVenta(v) : setShowNoAccess(true)}
                              className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:border-[#1E3A5F] hover:text-[#1E3A5F] transition"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => session?.email === OWNER_EMAIL ? setDeleteConfirm(v.id ?? null) : setShowNoAccess(true)}
                              className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:border-rose-400 hover:text-rose-600 transition"
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedRow === v.id && v.distribucion && (
                        <tr key={`${v.id}-detail`}>
                          <td colSpan={9} className="p-0">
                            <DistribucionDetail d={v.distribucion} />
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                  <tr>
                    <td className="px-4 py-3 text-xs font-bold uppercase text-slate-600" colSpan={5}>Totales ({filtered.length})</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{formatMXN(totalNeto)}</td>
                    <td className="px-4 py-3 font-bold text-slate-600">{formatMXN(totalIva)}</td>
                    <td className="px-4 py-3 font-bold text-[#1E3A5F]">{formatMXN(totalConIva)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
