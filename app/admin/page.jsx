"use client";

import { useCallback, useEffect, useState } from "react";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth } from "../../lib/firebase/client";

const ROLE_LABELS = {
  owner: "Owner",
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer",
};

const formatDate = (dateString) => {
  if (!dateString) return "Nunca";
  return new Date(dateString).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function AdminPage() {
  const [isChecking, setIsChecking] = useState(true);
  const [session, setSession] = useState(null);
  const [idToken, setIdToken] = useState("");
  const [setupStatus, setSetupStatus] = useState(null);
  const [setupData, setSetupData] = useState(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [leads, setLeads] = useState([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);

  const fetchStatus = useCallback(async () => {
    setIsChecking(true);
    try {
      const response = await fetch("/api/admin/status");
      if (!response.ok) {
        setSession(null);
        return;
      }
      const data = await response.json();
      setSession(data);
    } catch {
      setSession(null);
    } finally {
      setIsChecking(false);
    }
  }, []);

  const fetchLeads = useCallback(async () => {
    setIsLoadingLeads(true);
    try {
      const response = await fetch("/api/admin/leads");
      const data = await response.json();
      if (response.ok && data?.leads) {
        setLeads(data.leads);
      }
    } catch {
      // no-op
    } finally {
      setIsLoadingLeads(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (session?.ok) {
      fetchLeads();
    }
  }, [session, fetchLeads]);

  const handleSignIn = async () => {
    if (!auth) {
      setError("Firebase no está configurado.");
      return;
    }
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
      setIdToken(token);

      const response = await fetch("/api/admin/totp/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || "No pudimos preparar el acceso admin.");
        return;
      }
      setSetupStatus(data.status);
      setSetupData(data);
    } catch (err) {
      console.error(err);
      setError("No pudimos iniciar sesión.");
    }
  };

  const handleVerify = async () => {
    if (!idToken) {
      setError("Inicia sesión nuevamente.");
      return;
    }
    if (!code.trim()) {
      setError("Ingresa el código de verificación.");
      return;
    }

    setError("");
    try {
      if (setupStatus === "new" || setupStatus === "pending") {
        const verifyResponse = await fetch("/api/admin/totp/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken, code }),
        });
        const verifyData = await verifyResponse.json();
        if (!verifyResponse.ok) {
          setError(verifyData?.error || "Código inválido.");
          return;
        }
      }

      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, code }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || "No pudimos validar el acceso.");
        return;
      }

      setSession({ ok: true, email: data.email, role: data.role });
      setSetupStatus(null);
      setSetupData(null);
      setIdToken("");
      setCode("");
    } catch {
      setError("No pudimos validar el acceso.");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    if (auth) {
      await signOut(auth);
    }
    setSession(null);
    setIdToken("");
    setSetupStatus(null);
    setSetupData(null);
    setCode("");
  };

  if (isChecking) {
    return (
      <main className="min-h-screen bg-white px-6 py-16 text-slate-900">
        <p className="text-sm text-slate-500">Verificando sesión...</p>
      </main>
    );
  }

  if (session?.ok) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-semibold mb-1">Admin Dashboard</p>
              <h1 className="text-2xl font-bold text-slate-900">Usuarios Registrados</h1>
              <p className="text-sm text-slate-500 mt-1">
                Autenticado como: <span className="font-medium text-slate-700">{session.email}</span> ({ROLE_LABELS[session.role] || session.role})
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Usuarios</p>
                <p className="text-2xl font-bold text-slate-900">{leads.length}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 transition"
              >
                Cerrar sesión
              </button>
            </div>
          </header>

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-800">Directorio de Usuarios</h2>
              {isLoadingLeads && <span className="text-xs font-medium text-blue-600 animate-pulse">Actualizando lista...</span>}
            </div>

            <div className="overflow-x-auto">
              {leads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-slate-100 p-3 mb-3">
                    <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-slate-900">No hay leads registrados aún</p>
                  <p className="text-xs text-slate-500 mt-1">Los usuarios aparecerán aquí cuando se registren.</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th scope="col" className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">Email / Info</th>
                      <th scope="col" className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">Registro</th>
                      <th scope="col" className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">Último Acceso</th>
                      <th scope="col" className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">Proveedor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 border border-slate-200">
                              {lead.photo ? (
                                <img src={lead.photo} alt="" className="h-8 w-8 rounded-full object-cover" />
                              ) : (
                                (lead.email || "?")[0].toUpperCase()
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-900">{lead.email}</span>
                              <span className="text-xs text-slate-500">{lead.name}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                          {formatDate(lead.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                          {formatDate(lead.lastLogin)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800 border border-slate-200 capitalize">
                            {lead.provider || "email"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Mostrando <span className="font-medium">{leads.length}</span> usuarios más recientes.
              </p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 py-16 text-slate-900">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
        <header>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Admin</p>
          <h1 className="text-2xl font-semibold">Acceso restringido</h1>
          <p className="text-sm text-slate-500">
            Inicia sesión con Google y valida tu código de autenticación.
          </p>
        </header>

        {!idToken ? (
          <button
            type="button"
            onClick={handleSignIn}
            className="rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-black transition shadow-lg shadow-slate-900/20"
          >
            Entrar con Google
          </button>
        ) : (
          <div className="rounded-2xl border border-slate-200 p-5 shadow-sm">
            {setupStatus === "new" ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Escanea este QR con Google Authenticator y confirma el código.
                </p>
                {setupData?.qrCodeDataUrl ? (
                  <img
                    src={setupData.qrCodeDataUrl}
                    alt="QR 2FA"
                    className="h-40 w-40 rounded-lg border border-slate-200"
                  />
                ) : null}
                {setupData?.secret ? (
                  <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500 font-mono">
                    Clave manual: {setupData.secret}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-slate-600">
                Ingresa el código de Google Authenticator para continuar.
              </p>
            )}

            <div className="mt-4 flex gap-3">
              <input
                type="text"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="000 000"
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-center tracking-widest font-mono focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition"
                maxLength={6}
              />
              <button
                type="button"
                onClick={handleVerify}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black transition shadow-md"
              >
                Verificar
              </button>
            </div>
          </div>
        )}

        {error ? <p className="text-sm font-semibold text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-100">{error}</p> : null}
      </div>
    </main>
  );
}
