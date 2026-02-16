"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";

export default function MiCuentaPage() {
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!auth) return;
    const user = auth.currentUser;
    if (user?.email) {
      setEmail(user.email);
    }
  }, []);

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6 sm:p-10 dark:bg-slate-950 dark:border-slate-800 transition-colors duration-300">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400 font-raleway dark:text-slate-500">
          Mi Cuenta
        </p>
        <h1 className="mt-3 text-2xl sm:text-3xl font-semibold text-slate-900 font-raleway dark:text-white">
          ¡Bienvenido a Tripoli Media!
        </h1>
        <div className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400">
          {email ? (
            <p>
              Correo registrado:
              <span className="font-bold text-slate-900 dark:text-white">{email}</span>
            </p>
          ) : (
            <p>Tu registro fue exitoso.</p>
          )}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link
            href="/conocenos"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800 dark:hover:border-slate-600"
          >
            Conoce acerca de nosotros
          </Link>
          <Link
            href="/servicios"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800 dark:hover:border-slate-600"
          >
            Conoce nuestros Servicios
          </Link>
          <Link
            href="/contacto"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800 dark:hover:border-slate-600"
          >
            Contacta con el equipo de Tripoli Media
          </Link>
          <Link
            href="/"
            className="rounded-2xl bg-sky-500 px-3 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:bg-sky-600 hover:scale-[1.02] dark:bg-sky-500 dark:hover:bg-sky-400"
          >
            Ir a la página de inicio
          </Link>
        </div>
      </section>
    </main>
  );
}
