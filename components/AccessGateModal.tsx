"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";

import { auth } from "@/lib/firebase";
import { firebaseClientReady, initAnalytics } from "@/lib/firebase/client";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  signInWithGoogleAndRegister,
} from "@/lib/firebase/accessGate";

const STORAGE_KEY = "tripoli_access_gate_v1";
const COOKIE_NAME = "tripoli_access_gate";
const EMAIL_REGEX = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;

const getCookieValue = (name: string) => {
  if (typeof document === "undefined") return null;
  const entry = document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`));
  if (!entry) return null;
  const value = entry.split("=").slice(1).join("=");
  return value ? decodeURIComponent(value) : null;
};

const setCookieValue = (name: string, value: string, days = 365) => {
  if (typeof document === "undefined") return;
  const maxAge = days * 24 * 60 * 60;
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAge}; path=/; samesite=lax${secure}`;
};

const getStoredConsent = () => {
  if (typeof window === "undefined") return false;
  const localValue = window.localStorage.getItem(STORAGE_KEY);
  const cookieValue = getCookieValue(COOKIE_NAME);
  return localValue === "granted" || cookieValue === "granted";
};

const setStoredConsent = () => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, "granted");
    window.localStorage.setItem(`${STORAGE_KEY}_at`, new Date().toISOString());
  }
  setCookieValue(COOKIE_NAME, "granted");
};

const ConsentScripts = () => {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  return (
    <>
      {adsenseClient ? (
        <Script
          id="adsense-loader"
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      ) : null}
      {gaId ? (
        <>
          <Script
            id="ga-loader"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
          />
          <Script id="ga-config" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag("js", new Date());
gtag("config", "${gaId}", { anonymize_ip: true });`}
          </Script>
        </>
      ) : null}
    </>
  );
};

export default function AccessGateModal() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!firebaseClientReady) {
      console.warn("Access gate disabled: Firebase client not ready.");
      setHasConsent(false);
      setIsOpen(false);
      setIsReady(true);
      return;
    }
    const granted = getStoredConsent();
    setHasConsent(granted);
    setIsOpen(!granted);
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (hasConsent) {
      initAnalytics();
    }
  }, [hasConsent]);

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const handleConsentGranted = (redirectToAccount = false) => {
    setStoredConsent();
    setHasConsent(true);
    setIsOpen(false);
    if (redirectToAccount) {
      router.push("/mi-cuenta");
    }
  };

  const handleGoogleSignIn = async () => {
    if (isSubmitting) return;
    setError("");
    setIsSubmitting(true);
    try {
      await signInWithGoogleAndRegister();
      handleConsentGranted(true);
    } catch (err) {
      console.error("Google Login Error:", err);
      setError("No pudimos completar el registro. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestContinue = () => {
    if (isSubmitting) return;
    setError("");
    handleConsentGranted();
  };

  const handleRegister = async (event: FormEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    setError("");

    if (!EMAIL_REGEX.test(email.trim())) {
      setError("Ingresa un correo valido.");
      return;
    }
    if (!password || password.length < 6) {
      setError("La contraseña es muy corta.");
      return;
    }
    if (!acceptTerms) {
      setError("Debes aceptar los terminos para continuar.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      handleConsentGranted(true);
    } catch (err: any) {
      const code = err?.code;
      if (code === "auth/email-already-in-use") {
        setError("El usuario ya existe.");
      } else if (code === "auth/weak-password") {
        setError("La contraseña es muy corta.");
      } else {
        setError("No pudimos completar el registro. Intenta de nuevo.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isReady) return null;

  return (
    <>
      {hasConsent ? <ConsentScripts /> : null}
      {isOpen ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 px-4 py-8 backdrop-blur-sm">
          <div
            className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200"
            role="dialog"
            aria-modal="true"
            aria-label="Acceso a Tripoli Media"
          >
            <div className="grid gap-0 lg:grid-cols-2">
              <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-black p-8 text-white">
                <div className="absolute -left-20 -top-24 h-56 w-56 rounded-full bg-amber-400/20 blur-3xl" aria-hidden="true" />
                <div className="absolute -bottom-24 right-0 h-48 w-48 rounded-full bg-sky-500/20 blur-3xl" aria-hidden="true" />
                <div className="relative">
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-amber-300">Tripoli Media</p>
                  <h2 className="mt-4 text-3xl font-semibold leading-tight">
                    Registrese gratis y consiga:
                  </h2>
                  <p className="mt-3 text-sm text-slate-300">
                    Acceso inmediato a una experiencia editorial premium para lideres, agencias y decisores.
                  </p>
                  <ul className="mt-8 space-y-5 text-sm text-slate-200">
                    <li className="flex items-start gap-3">
                      <span className="mt-2 h-2 w-2 rounded-full bg-amber-400" />
                      <div>
                        <p className="font-semibold text-white">Alertas en tiempo real</p>
                        <p className="text-slate-300">Insights y tendencias clave para tu industria.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-2 h-2 w-2 rounded-full bg-amber-400" />
                      <div>
                        <p className="font-semibold text-white">Portafolio avanzado</p>
                        <p className="text-slate-300">Guarda y organiza los temas que mas importan.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-2 h-2 w-2 rounded-full bg-amber-400" />
                      <div>
                        <p className="font-semibold text-white">Graficos personalizados</p>
                        <p className="text-slate-300">Visualiza indicadores y desempeno de mercado.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-2 h-2 w-2 rounded-full bg-amber-400" />
                      <div>
                        <p className="font-semibold text-white">App movil sincronizada</p>
                        <p className="text-slate-300">Accede desde cualquier dispositivo sin perder contexto.</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="p-8 lg:p-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-semibold text-slate-900">Bienvenido</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Elige como quieres acceder a Tripoli Media.
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-3 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-blue-600">
                      G
                    </span>
                    Registrarse y continuar con Google
                  </button>
                </div>

                <div className="my-6 flex items-center gap-4">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs uppercase tracking-[0.3em] text-slate-400">o</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <div>
                    <label htmlFor="guestEmail" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Correo
                    </label>
                    <input
                      id="guestEmail"
                      type="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        if (error) setError("");
                      }}
                      placeholder="tu@empresa.com"
                      className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                    />
                  </div>
                  <div>
                    <label htmlFor="guestPassword" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Contrase\u00f1a
                    </label>
                    <input
                      id="guestPassword"
                      type="password"
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        if (error) setError("");
                      }}
                      placeholder="Contrase\u00f1a"
                      className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                    />
                  </div>

                  <label className="flex items-start gap-3 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(event) => {
                        setAcceptTerms(event.target.checked);
                        if (error) setError("");
                      }}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                    />
                    <span>
                      Acepto los{" "}
                      <Link href="/terminos-y-condiciones" className="font-semibold text-slate-900 underline underline-offset-4">
                        Terminos y condiciones
                      </Link>{" "}
                      y el{" "}
                      <Link href="/aviso-de-privacidad" className="font-semibold text-slate-900 underline underline-offset-4">
                        Aviso de privacidad
                      </Link>
                      .
                    </span>
                  </label>

                  {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}

                  <button
                    type="submit"
                    onClick={handleRegister}
                    disabled={isSubmitting}
                    className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Registrarse con correo
                  </button>
                  <button
                    type="button"
                    onClick={handleGuestContinue}
                    disabled={isSubmitting}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Continuar como invitado
                  </button>
                </form>

                <p className="mt-6 text-xs text-slate-400">
                  Al continuar, validas tu consentimiento para fines de acceso y experiencia personalizada.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
