"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { signInWithGoogleAndRegister, saveGuestLead } from "@/lib/firebase/accessGate";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegistroPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleGoogleSignIn = async () => {
        if (isSubmitting) return;
        setError("");
        setIsSubmitting(true);
        try {
            await signInWithGoogleAndRegister();
            router.push("/mi-cuenta");
        } catch (err) {
            console.error("Google Login Error:", err);
            setError("No pudimos completar el registro. Intenta de nuevo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGuestContinue = () => {
        if (isSubmitting) return;
        router.push("/");
    };

    const handleRegister = async (event: FormEvent<HTMLButtonElement>) => {
        event.preventDefault();
        if (isSubmitting) return;
        setError("");

        if (!EMAIL_REGEX.test(email.trim())) {
            setError("Ingresa un correo valido.");
            return;
        }

        if (!acceptTerms) {
            setError("Debes aceptar los terminos para continuar.");
            return;
        }

        setIsSubmitting(true);
        try {
            await saveGuestLead({ email: email.trim() });
            router.push("/mi-cuenta");
        } catch (err: any) {
            console.error(err);
            setError("No pudimos completar el registro. Intenta de nuevo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <style jsx>{`
        .tm-gradient-bg {
          background-image: linear-gradient(90deg, #0082b9, #83d0f5, #0082b9);
          background-size: 300% 100%;
          animation: tmHeaderFlow 12.5s linear infinite;
        }
        @keyframes tmHeaderFlow {
          0%   { background-position: 0% 0; }
          50%  { background-position: 100% 0; }
          100% { background-position: 0% 0; }
        }
      `}</style>

            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
                <div className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
                    <div className="grid gap-0 lg:grid-cols-2">

                        {/* Left Side: Animated Gradient + Benefits */}
                        <div className="relative overflow-hidden tm-gradient-bg p-8 sm:p-10 text-white">
                            <div className="absolute -left-20 -top-24 h-56 w-56 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
                            <div className="absolute -bottom-24 right-0 h-48 w-48 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
                            <div className="relative">
                                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/80">Tripoli Media</p>
                                <h1 className="mt-4 text-2xl sm:text-3xl font-semibold leading-tight">
                                    Regístrese gratis y consiga:
                                </h1>
                                <p className="mt-3 text-sm text-white/90">
                                    Acceso inmediato a una experiencia editorial premium para líderes, agencias y tomadores de decisiones.
                                </p>
                                <ul className="mt-8 space-y-5 text-sm text-white/90">
                                    <li className="flex items-start gap-3">
                                        <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-white" />
                                        <div>
                                            <p className="font-semibold text-white">Agenda VIP</p>
                                            <p className="text-white/80">Invitaciones a eventos especiales y networking de alto nivel.</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-white" />
                                        <div>
                                            <p className="font-semibold text-white">Alertas en tiempo real</p>
                                            <p className="text-white/80">Conoce al momento las noticias, insights y tendencias clave para tu industria.</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-white" />
                                        <div>
                                            <p className="font-semibold text-white">App móvil sincronizada</p>
                                            <p className="text-white/80">Accede desde cualquier dispositivo sin perder contexto.</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-white" />
                                        <div>
                                            <p className="font-semibold text-white">Portafolio avanzado</p>
                                            <p className="text-white/80">Guarda y organiza los temas que más importan.</p>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Right Side: Form */}
                        <div className="p-8 sm:p-10 bg-white">
                            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900">Bienvenido</h2>
                            <p className="mt-1 text-xs sm:text-sm text-slate-600">
                                Elige como quieres acceder a Tripoli Media.
                            </p>

                            <div className="mt-6 space-y-4">
                                <button
                                    type="button"
                                    onClick={handleGoogleSignIn}
                                    disabled={isSubmitting}
                                    className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xs">
                                        G
                                    </span>
                                    Registrarse y continuar con Google
                                </button>
                            </div>

                            <div className="my-6 flex items-center gap-4">
                                <div className="h-px flex-1 bg-slate-200" />
                                <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-slate-400">o</span>
                                <div className="h-px flex-1 bg-slate-200" />
                            </div>

                            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                                <div>
                                    <label htmlFor="guestEmail" className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                        Correo
                                    </label>
                                    <input
                                        id="guestEmail"
                                        type="email"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            if (error) setError("");
                                        }}
                                        placeholder="Escribe tu correo"
                                        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>

                                <label className="flex items-start gap-3 text-xs sm:text-sm text-slate-600">
                                    <input
                                        type="checkbox"
                                        checked={acceptTerms}
                                        onChange={(e) => {
                                            setAcceptTerms(e.target.checked);
                                            if (error) setError("");
                                        }}
                                        className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span>
                                        Acepto los{" "}
                                        <Link href="/terminos-y-condiciones" className="font-semibold text-slate-900 underline underline-offset-4">
                                            Términos y condiciones
                                        </Link>{" "}
                                        y el{" "}
                                        <Link href="/aviso-de-privacidad" className="font-semibold text-slate-900 underline underline-offset-4">
                                            Aviso de privacidad
                                        </Link>
                                        .
                                    </span>
                                </label>

                                {error ? (
                                    <p className="text-sm font-semibold text-rose-600 bg-rose-50 p-2 rounded">{error}</p>
                                ) : null}

                                <button
                                    type="submit"
                                    onClick={handleRegister}
                                    disabled={isSubmitting}
                                    className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 shadow-lg"
                                >
                                    Continuar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleGuestContinue}
                                    disabled={isSubmitting}
                                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Continuar como invitado
                                </button>
                            </form>

                            <p className="mt-6 text-[10px] sm:text-xs text-slate-500">
                                Al continuar, validas tu consentimiento para fines de acceso y experiencia personalizada.
                            </p>
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
}
