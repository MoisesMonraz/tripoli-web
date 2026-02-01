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
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6 sm:p-10">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400 font-raleway">
          Mi Cuenta
        </p>
        <h1 className="mt-3 text-2xl sm:text-3xl font-semibold text-slate-900 font-raleway">
          Bienvenido a Tripoli Media
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600">
          {email ? `Tu correo registrado: ${email}` : "Tu registro fue exitoso."}
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link
            href="/contacto"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-white"
          >
            Contactar con Tripoli
          </Link>
          <Link
            href="/servicios"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-white"
          >
            Ver servicios
          </Link>
          <Link
            href="/calendario"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-white"
          >
            Calendario editorial
          </Link>
          <Link
            href="/"
            className="rounded-2xl border border-slate-900 bg-slate-900 px-4 py-4 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Ir al Home
          </Link>
        </div>
      </section>
    </main>
  );
}
