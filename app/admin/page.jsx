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
      <main className="min-h-screen bg-white px-6 py-16 text-slate-900">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Admin</p>
              <h1 className="text-2xl font-semibold">Panel de control</h1>
              <p className="text-sm text-slate-500">
                {session.email} · {ROLE_LABELS[session.role] || session.role}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
            >
              Cerrar sesión
            </button>
          </header>

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Últimos leads</h2>
              {isLoadingLeads ? <span className="text-xs text-slate-400">Cargando...</span> : null}
            </div>
            <div className="mt-4 divide-y divide-slate-200">
              {leads.length === 0 ? (
                <p className="py-4 text-sm text-slate-500">No hay leads recientes.</p>
              ) : (
                leads.map((lead) => (
                  <div key={lead.id} className="flex flex-col gap-1 py-3 text-sm">
                    <span className="font-semibold text-slate-900">{lead.name || "Sin nombre"}</span>
                    <span className="text-slate-600">{lead.email || "Sin email"}</span>
                    <span className="text-xs text-slate-400">{lead.createdAt || "Sin fecha"}</span>
                  </div>
                ))
              )}
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
            className="rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-black"
          >
            Entrar con Google
          </button>
        ) : (
          <div className="rounded-2xl border border-slate-200 p-5">
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
                  <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
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
                placeholder="123456"
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={handleVerify}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
              >
                Verificar
              </button>
            </div>
          </div>
        )}

        {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
      </div>
    </main>
  );
}
