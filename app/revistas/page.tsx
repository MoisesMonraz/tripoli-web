import { getRevistas } from '../../lib/revistas';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import RevistaCard from '../../components/revistas/RevistaCard';
import { CATEGORIA_LABELS, ALL_CATEGORIAS, type CategoriaSlug } from '../../types/revistas';

export const metadata: Metadata = {
  title: 'Revistas | Tripoli Media',
  description: 'Explora todas las revistas digitales de Tripoli Media.',
};

export const revalidate = 3600;

interface Props {
  searchParams: Promise<{ categoria?: string }>;
}

export default async function RevistasPage({ searchParams }: Props) {
  const { categoria: categoriaParam } = await searchParams;
  const categoriaValida = ALL_CATEGORIAS.includes(categoriaParam as CategoriaSlug)
    ? (categoriaParam as CategoriaSlug)
    : undefined;

  const revistas = await getRevistas({ categoria: categoriaValida });

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-16">
      {/* Hero header */}
      <div className="bg-[#1E3A5F] text-white py-10 px-4">
        <div className="max-w-[70rem] mx-auto">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50 font-semibold mb-1">Tripoli Media</p>
          <h1 className="text-3xl font-bold mb-2">Revistas Digitales</h1>
          <p className="text-white/70 text-sm max-w-xl">
            Explora nuestras publicaciones interactivas sobre negocios, tecnología, política y más.
          </p>
        </div>
      </div>

      <div className="max-w-[70rem] mx-auto px-4 py-8">
        {/* Category filter pills */}
        <div className="flex gap-2 flex-wrap mb-8">
          <Link
            href="/revistas"
            className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide transition ${
              !categoriaValida
                ? 'bg-[#1E3A5F] text-white'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#1E3A5F] hover:text-[#1E3A5F]'
            }`}
          >
            Todas
          </Link>
          {ALL_CATEGORIAS.map(cat => (
            <Link
              key={cat}
              href={`/revistas?categoria=${cat}`}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide transition ${
                categoriaValida === cat
                  ? 'bg-[#1E3A5F] text-white'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#1E3A5F] hover:text-[#1E3A5F]'
              }`}
            >
              {CATEGORIA_LABELS[cat]}
            </Link>
          ))}
        </div>

        {revistas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-slate-400 text-lg font-medium mb-2">No hay revistas disponibles</p>
            <p className="text-slate-400 text-sm">
              {categoriaValida
                ? `Aún no hay revistas en la categoría "${CATEGORIA_LABELS[categoriaValida]}".`
                : 'Próximamente publicaremos nuevas ediciones.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {revistas.map(r => (
              <RevistaCard key={r.id} revista={r} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
