'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminRevistaEditor from '../../../../components/revistas/AdminRevistaEditor';

export default function NuevaRevistaPage() {
  const [session, setSession] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(true);

  const fetchSession = useCallback(async () => {
    setIsChecking(true);
    try {
      const res = await fetch('/api/admin/status');
      if (res.ok) setSession(await res.json());
      else setSession(null);
    } catch { setSession(null); }
    finally { setIsChecking(false); }
  }, []);

  useEffect(() => { fetchSession(); }, [fetchSession]);

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

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl flex flex-col gap-6">
        <header className="flex items-center justify-between bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-semibold mb-1">Admin / Revistas</p>
            <h1 className="text-xl font-bold text-slate-900">Nueva Revista</h1>
          </div>
          <a href="/admin/revistas" className="text-sm text-slate-500 hover:text-[#1E3A5F] transition">
            ← Volver
          </a>
        </header>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <AdminRevistaEditor />
        </div>
      </div>
    </main>
  );
}
