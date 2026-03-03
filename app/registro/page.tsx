"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { signInWithGoogleAndRegister } from "@/lib/firebase/accessGate";

export default function RegistroPage() {
    const router = useRouter();
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

            {/* Full-page centered layout */}
            <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-4">
                {/* Card: single panel, centered, ~20% wider than original half (~512px → max-w-2xl = 672px) */}
                <div className="w-full max-w-2xl overflow-hidden rounded-2xl shadow-2xl ring-1 ring-slate-200">

                    {/* Gradient panel – full width */}
                    <div className="relative overflow-hidden tm-gradient-bg p-10 sm:p-12 text-white">
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

                            {/* Benefits list */}
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

                            {/* Google button – below benefits list */}
                            <div className="mt-10">
                                <button
                                    type="button"
                                    onClick={handleGoogleSignIn}
                                    disabled={isSubmitting}
                                    className="flex w-full items-center justify-center gap-3 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-md transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xs">
                                        G
                                    </span>
                                    Registrarse y continuar con Google
                                </button>

                                {error ? (
                                    <p className="mt-3 text-sm font-semibold text-white/90 bg-white/20 p-2 rounded">{error}</p>
                                ) : null}

                                <p className="mt-4 text-center text-[10px] sm:text-xs text-white/70">
                                    Al continuar, validas tu consentimiento para fines de acceso y experiencia personalizada.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}
