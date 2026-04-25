'use client';

import { useCallback, useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../../lib/firebase/client';
import type { Revista } from '../../../types/revistas';
import { CATEGORIA_LABELS } from '../../../types/revistas';

function formatDate(iso: string) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${months[parseInt(m) - 1]} ${d}, ${y}`;
}

export default function AdminRevistasPage() {
  const [session, setSession] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [revistas, setRevistas] = useState<Revista[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    setIsChecking(true);
    try {
      const res = await fetch('/api/admin/status');
      if (res.ok) setSession(await res.json());
      else setSession(null);
    } catch { setSession(null); }
    finally { setIsChecking(false); }
  }, []);

  const fetchRevistas = useCallback(async () => {
    if (!db) return;
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'revistas'), orderBy('fechaPublicacion', 'desc')));
      setRevistas(snap.docs.map(d => ({ id: d.id, ...d.data() } as Revista)));
    } catch { /* no-op */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSession(); }, [fetchSession]);
  useEffect(() => { if (session?.ok) fetchRevistas(); }, [session, fetchRevistas]);

  const toggleEstado = async (revista: Revista) => {
    if (!db) return;
    const next = revista.estado === 'publicada' ? 'borrador' : 'publicada';
    setActionLoading(revista.id);
    try {
      await updateDoc(doc(db, 'revistas', revista.id), { estado: next });
      setRevistas(prev => prev.map(r => r.id === revista.id ? { ...r, estado: next } : r));
    } catch { /* no-op */ }
    finally { setActionLoading(null); }
  };

  const handleDelete = async (id: string) => {
    if (!db) return;
    setActionLoading(id);
    try {
      await deleteDoc(doc(db, 'revistas', id));
      setRevistas(prev => prev.filter(r => r.id !== id));
    } catch { /* no-op */ }
    finally { setActionLoading(null); setConfirmDelete(null); }
  };

  if (isChecking) {
    return (
      <main className="min-h-screen bg-white px-6 py-16">
        <p className="text-sm text-slate-500">Verificando sesión...</p>
      </main>
    );
  }

  if (!session?.ok) {
    return (
      <main className="min-h-screen bg-white px-6 py-16">
        <p className="text-sm text-slate-500">
          Acceso no autorizado.{' '}
          <a href="/admin" className="text-[#1E3A5F] underline">Volver al admin</a>
        </p>
      </main>
    );
  }

  const publicadas = revistas.filter(r => r.estado === 'publicada').length;
  const borradores = revistas.filter(r => r.estado === 'borrador').length;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl flex flex-col gap-6">

        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-semibold mb-1">Admin</p>
            <h1 className="text-2xl font-bold text-slate-900">Revistas Digitales</h1>
            <p className="text-sm text-slate-500 mt-1">
              {publicadas} publicadas · {borradores} borradores
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <a
              href="/admin/revistas/nueva"
              className="rounded-lg bg-[#1E3A5F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#16304e] transition"
            >
              + Nueva revista
            </a>
            <a
              href="/admin"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition"
            >
              ← Panel
            </a>
          </div>
        </header>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total', value: revistas.length, color: 'text-slate-700' },
            { label: 'Publicadas', value: publicadas, color: 'text-emerald-600' },
            { label: 'Borradores', value: borradores, color: 'text-amber-500' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm text-center">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-wide font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-sm text-slate-400">Cargando revistas...</p>
            </div>
          ) : revistas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <p className="text-slate-400 text-sm">No hay revistas aún.</p>
              <a href="/admin/revistas/nueva" className="text-[#1E3A5F] text-sm font-medium underline">
                Crear la primera revista
              </a>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Título</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 hidden sm:table-cell">Categorías</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 hidden md:table-cell">Páginas</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 hidden md:table-cell">Publicación</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {revistas.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {r.portadaURL && (
                            <img src={r.portadaURL} alt="" className="w-8 h-10 object-cover rounded shrink-0" />
                          )}
                          <div>
                            <p className="font-medium text-slate-900 leading-tight">{r.titulo}</p>
                            <p className="text-xs text-slate-400">{r.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          r.estado === 'publicada'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {r.estado === 'publicada' ? 'Publicada' : 'Borrador'}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {(r.categorias || []).slice(0, 2).map(cat => (
                            <span key={cat} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              {CATEGORIA_LABELS[cat]}
                            </span>
                          ))}
                          {(r.categorias || []).length > 2 && (
                            <span className="text-[10px] text-slate-400">+{r.categorias.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                        {r.totalPaginas || r.paginas?.length || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                        {formatDate(r.fechaPublicacion)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {r.estado === 'publicada' && (
                            <a
                              href={`/revistas/${r.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-slate-500 hover:text-[#1E3A5F] transition"
                            >
                              Ver
                            </a>
                          )}
                          <a
                            href={`/admin/revistas/${r.id}/editar`}
                            className="text-xs text-[#1E3A5F] hover:underline"
                          >
                            Editar
                          </a>
                          <button
                            onClick={() => toggleEstado(r)}
                            disabled={actionLoading === r.id}
                            className={`text-xs font-medium transition ${
                              r.estado === 'publicada'
                                ? 'text-amber-600 hover:text-amber-800'
                                : 'text-emerald-600 hover:text-emerald-800'
                            }`}
                          >
                            {actionLoading === r.id ? '...' : r.estado === 'publicada' ? 'Despublicar' : 'Publicar'}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(r.id)}
                            disabled={actionLoading === r.id}
                            className="text-xs text-rose-500 hover:text-rose-700 transition"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-slate-900 mb-2">¿Eliminar revista?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Esta acción no se puede deshacer. Los archivos en Storage no serán eliminados automáticamente.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={actionLoading === confirmDelete}
                className="px-4 py-2 text-sm rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 transition"
              >
                {actionLoading === confirmDelete ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
