import Image from "next/image";
import Link from "next/link";
import { getRevistas } from "@/lib/revistas";
import type { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Revistas | Tripoli Media",
  description: "Biblioteca digital de revistas especializadas de Tripoli Media.",
};

export default async function RevistasPage() {
  const revistas = await getRevistas();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1">
          Biblioteca digital
        </p>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Revistas</h1>
      </header>

      {revistas.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400">No hay revistas disponibles aún.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {revistas.map((revista) => (
            <Link
              key={revista.id}
              href={`/revistas/${revista.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-md transition hover:border-[#00BFFF]/60 hover:shadow-lg dark:border-slate-800/70 dark:bg-slate-900 dark:hover:border-[#33ceff]/60"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-slate-100 dark:bg-slate-800">
                {revista.previewUrl ? (
                  <Image
                    src={revista.previewUrl}
                    alt={revista.titulo}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-400 text-sm">
                    Sin portada
                  </div>
                )}
                <span className="absolute top-3 left-3 rounded-full bg-[#1E3A5F]/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow">
                  {revista.categoria.nombre}
                </span>
              </div>

              <div className="flex flex-col gap-2 p-4">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50 line-clamp-2 transition group-hover:text-[#00BFFF]">
                  {revista.titulo}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3">
                  {revista.descripcion}
                </p>
                <div className="mt-auto flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {revista.autor.nombre}
                  </span>
                  <span className="text-[11px] font-semibold text-[#00BFFF] group-hover:underline">
                    Leer revista →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
