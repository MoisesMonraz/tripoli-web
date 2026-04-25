'use client';

import { useCallback, useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../../lib/firebase/client';
import type { Revista } from '../../../../../types/revistas';
import AdminRevistaEditor from '../../../../../components/revistas/AdminRevistaEditor';
import { use } from 'react';

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditarRevistaPage({ params }: Props) {
  const { id } = use(params);
  const [session, setSession] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [revista, setRevista] = useState<Revista | null>(null);
  const [loadingRevista, setLoadingRevista] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const fetchSession = useCallback(async () => {
    setIsChecking(true);
    try {
      const res = await fetch('/api/admin/status');
      if (res.ok) setSession(await res.json());
      else setSession(null);
    } catch { setSession(null); }
    finally { setIsChecking(false); }
  }, []);

  const fetchRevista = useCallback(async () => {
    if (!db || !id) return;
    setLoadingRevista(true);
    try {
      const snap = await getDoc(doc(db, 'revistas', id));
      if (!snap.exists()) { setNotFound(true); return; }
      setRevista({ id: snap.id, ...snap.data() } as Revista);
    } catch { setNotFound(true); }
    finally { setLoadingRevista(false); }
  }, [id]);

  useEffect(() => { fetchSession(); }, [fetchSession]);
  useEffect(() => { if (session?.ok) fetchRevista(); }, [session, fetchRevista]);

  if (isChecking || (session?.ok && loadingRevista)) {
    return (
      <main className="min-h-screen bg-white px-6 py-16">
        <p className="text-sm text-slate-500">Cargando...</p>
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

  if (notFound || !revista) {
    return (
      <main className="min-h-screen bg-white px-6 py-16">
        <p className="text-sm text-slate-500">
          Revista no encontrada.{' '}
          <a href="/admin/revistas" className="text-[#1E3A5F] underline">Volver a revistas</a>
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl flex flex-col gap-6">
        <header className="flex items-center justify-between bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-semibold mb-1">Admin / Revistas</p>
            <h1 className="text-xl font-bold text-slate-900 truncate">Editar: {revista.titulo}</h1>
          </div>
          <a href="/admin/revistas" className="text-sm text-slate-500 hover:text-[#1E3A5F] transition shrink-0">
            ← Volver
          </a>
        </header>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <AdminRevistaEditor existing={revista} />
        </div>
      </div>
    </main>
  );
}
