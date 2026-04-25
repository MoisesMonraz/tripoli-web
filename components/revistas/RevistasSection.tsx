'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase/client';
import RevistaCard from './RevistaCard';
import type { Revista, CategoriaSlug } from '../../types/revistas';
import { CATEGORIA_LABELS } from '../../types/revistas';

interface Props {
  categoria: CategoriaSlug;
}

export default function RevistasSection({ categoria }: Props) {
  const [revistas, setRevistas] = useState<Revista[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!db) { setLoaded(true); return; }
    getDocs(query(
      collection(db, 'revistas'),
      where('estado', '==', 'publicada'),
      where('categorias', 'array-contains', categoria),
    ))
      .then(snap => {
        const data = snap.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Revista))
          .sort((a, b) => b.fechaPublicacion.localeCompare(a.fechaPublicacion));
        setRevistas(data);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [categoria]);

  if (!loaded || revistas.length === 0) return null;

  const label = CATEGORIA_LABELS[categoria];

  return (
    <section className="flex flex-col gap-4 px-4 max-w-[70rem] mx-auto w-full sm:px-[12px] md:px-4 pb-4">
      {/* Section header — matches existing category style */}
      <div className="relative w-full">
        <div className="relative z-10 flex items-stretch gap-0">
          <span className="h-[44px] w-[8px] bg-[#1E3A5F]" aria-hidden="true" />
          <h2 className="inline-flex h-[44px] items-center px-3 text-lg lg:text-xl font-semibold uppercase font-raleway tracking-[0.05em] text-[#1E3A5F] bg-white dark:bg-transparent">
            Revistas de {label}
          </h2>
          <div className="h-[44px] flex-1 bg-gradient-to-r from-[#1E3A5F]/30 to-transparent" aria-hidden="true" />
        </div>
      </div>

      {/* Horizontal scrollable strip */}
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
        {revistas.map(r => (
          <div key={r.id} className="shrink-0 snap-start">
            <RevistaCard revista={r} compact />
          </div>
        ))}
      </div>

      {/* See all link */}
      <div className="text-right">
        <Link
          href={`/revistas?categoria=${categoria}`}
          className="text-[10.5px] sm:text-[14px] font-bold uppercase tracking-[0.08em] text-slate-700 dark:text-slate-200 hover:text-[#1E3A5F] transition-colors"
        >
          Ver todas las revistas →
        </Link>
      </div>
    </section>
  );
}
