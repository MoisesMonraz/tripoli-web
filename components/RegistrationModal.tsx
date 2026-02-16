"use client";

import { useEffect, useState, useCallback, type FormEvent } from "react";
import { saveGuestLead } from "@/lib/firebase/accessGate";
import { firebaseClientReady } from "@/lib/firebase/client";

const STORAGE_KEY = "tripoli_registration_modal_v1";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TRIGGER_DELAY_MS = 10_000; // 10 seconds
const SCROLL_THRESHOLD = 0.5; // 50%

const getStoredDismissal = (): boolean => {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(STORAGE_KEY) === "dismissed";
};

const setStoredDismissal = () => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, "dismissed");
  }
};

export default function RegistrationModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [hasTriggered, setHasTriggered] = useState(false);

  const openModal = useCallback(() => {
    if (hasTriggered || getStoredDismissal()) return;
    setHasTriggered(true);
    setIsOpen(true);
  }, [hasTriggered]);

  // Trigger after 10 seconds
  useEffect(() => {
    if (!firebaseClientReady || getStoredDismissal()) return;

    const timer = setTimeout(() => {
      openModal();
    }, TRIGGER_DELAY_MS);

    return () => clearTimeout(timer);
  }, [openModal]);

  // Trigger at 50% scroll on article pages
  useEffect(() => {
    if (!firebaseClientReady || getStoredDismissal()) return;

    const handleScroll = () => {
      // Check if we're on an article page
      const isArticlePage =
        window.location.pathname.includes("/articulo") ||
        window.location.pathname.includes("/noticia") ||
        document.querySelector("article") !== null;

      if (!isArticlePage) return;

      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? scrollTop / docHeight : 0;

      if (scrollPercent >= SCROLL_THRESHOLD) {
        openModal();
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [openModal]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const handleClose = () => {
    setStoredDismissal();
    setIsOpen(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError("");

    const trimmedEmail = email.trim();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError("Por favor, ingresa un correo válido.");
      return;
    }

    setIsSubmitting(true);
    try {
      await saveGuestLead({ email: trimmedEmail });
      await saveGuestLead({ email: trimmedEmail });
      setStoredDismissal();
      setIsOpen(false);
    } catch (err) {
      console.error("Registration error:", err);
      setError("No pudimos completar tu registro. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/70 backdrop-blur-sm p-4">
      <div
        className="relative w-full max-w-md animate-fadeIn"
        role="dialog"
        aria-modal="true"
        aria-labelledby="registration-modal-title"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute -top-3 -right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 shadow-lg ring-1 ring-slate-700 transition-all hover:bg-slate-700 hover:text-white sm:-top-4 sm:-right-4 sm:h-10 sm:w-10"
          aria-label="Cerrar"
        >
          <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal content */}
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 shadow-2xl ring-1 ring-white/10">
          {/* Decorative elements */}
          <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-sky-500/20 blur-3xl" aria-hidden="true" />
          <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-cyan-500/20 blur-3xl" aria-hidden="true" />

          <div className="relative p-6 sm:p-8">
            {/* Form State */}

            {/* Header */}
            <div className="mb-6 text-center">
              <h2 id="registration-modal-title" className="text-xl font-semibold leading-tight text-white sm:text-2xl">
                Mantente informado con Tripoli Media
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                Recibe las noticias más relevantes directamente en tu correo.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="registration-email" className="sr-only">
                  Correo electrónico
                </label>
                <input
                  id="registration-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Tu correo electrónico"
                  autoComplete="email"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3.5 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-center text-sm font-medium text-rose-400 ring-1 ring-rose-500/20">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-all hover:from-sky-400 hover:to-cyan-400 hover:shadow-sky-500/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Registrando...
                  </span>
                ) : (
                  "Unirme ahora"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
