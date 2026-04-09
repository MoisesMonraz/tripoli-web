"use client";

import { useCallback, useEffect, useState } from "react";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth } from "../../lib/firebase/client";
const OWNER_EMAIL = 'monrazescoto@gmail.com';

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

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

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
    const isOwner = session.email === OWNER_EMAIL;
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-semibold mb-1">Admin Dashboard</p>
              <h1 className="text-2xl font-bold text-slate-900">Panel de Administración</h1>
              <p className="text-sm text-slate-500 mt-1">
                Autenticado como: <span className="font-medium text-slate-700">{session.email}</span>{' '}
                ({isOwner ? (ROLE_LABELS[session.role] || session.role) : 'Coordinador'})
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap justify-end">
              {isOwner && (
                <>
                  <a href="/admin/directorio" className="rounded-lg border border-[#1E3A5F] px-4 py-2 text-sm font-semibold text-[#1E3A5F] hover:bg-[#1E3A5F] hover:text-white transition">
                    Directorio
                  </a>
                </>
              )}
              <a href="/admin/finanzas" className="rounded-lg border border-[#1E3A5F] px-4 py-2 text-sm font-semibold text-[#1E3A5F] hover:bg-[#1E3A5F] hover:text-white transition">
                Finanzas
              </a>
              {isOwner && (
                <>
                  <a href="/admin/links" className="rounded-lg border border-[#1E3A5F] px-4 py-2 text-sm font-semibold text-[#1E3A5F] hover:bg-[#1E3A5F] hover:text-white transition">
                    Links
                  </a>
                  <a href="/admin/shortener" className="rounded-lg border border-[#1E3A5F] px-4 py-2 text-sm font-semibold text-[#1E3A5F] hover:bg-[#1E3A5F] hover:text-white transition">
                    Shortener
                  </a>
                </>
              )}
              <button type="button" onClick={handleLogout} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 transition">
                Cerrar sesión
              </button>
            </div>
          </header>
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
