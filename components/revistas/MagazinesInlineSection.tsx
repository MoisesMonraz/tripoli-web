'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase/client';
import NewsCarousel from '../home/NewsCarousel';
import type { CategoriaSlug } from '../../types/revistas';
import { CATEGORIA_LABELS } from '../../types/revistas';

interface Props {
  categoria: CategoriaSlug;
}

export default function MagazinesInlineSection({ categoria }: Props) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!db) { setLoaded(true); return; }
    getDocs(query(
      collection(db, 'revistas'),
      where('estado', '==', 'publicada'),
      where('categorias', 'array-contains', categoria),
    ))
      .then(snap => {
        const items = snap.docs
          .map(doc => {
            const d = doc.data();
            return {
              slug: `rev-${d.slug}`,
              title: d.titulo ?? '',
              excerpt: d.descripcion ?? '',
              image: d.previewURL ?? d.portadaURL ?? '',
              date: d.fechaPublicacion ?? '',
              dateISO: d.fechaPublicacion ?? '',
              href: `/revistas/${d.slug}`,
              badge: 'REVISTA',
            };
          })
          .sort((a, b) => b.dateISO.localeCompare(a.dateISO));
        setPosts(items);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [categoria]);

  if (!loaded || posts.length === 0) return null;

  const label = CATEGORIA_LABELS[categoria];

  return (
    <section className="flex flex-col gap-4 px-4 max-w-[70rem] mx-auto w-full sm:px-[12px] md:px-4 pb-4">
      <div className="relative w-full">
        <div className="relative z-10 flex items-stretch gap-0">
          <span className="h-[44px] w-[8px] bg-[#1E3A5F]" aria-hidden="true" />
          <h2 className="inline-flex h-[44px] items-center px-3 text-lg lg:text-xl font-semibold uppercase font-raleway tracking-[0.05em] text-[#1E3A5F] bg-white dark:bg-transparent">
            Revistas de {label}
          </h2>
          <div className="h-[44px] flex-1 bg-gradient-to-r from-[#1E3A5F]/20 to-transparent" aria-hidden="true" />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-[10.5px] sm:text-[14px] font-bold uppercase tracking-[0.08em] text-slate-700 dark:text-slate-200">
          Novedades
        </p>
        <NewsCarousel posts={posts} />
        <Link
          href={`/revistas?categoria=${categoria}`}
          className="group relative text-right text-[10.5px] sm:text-[14px] font-bold uppercase tracking-[0.08em] text-slate-700 dark:text-slate-200 transition-colors duration-200 hover:text-[#1E3A5F] dark:hover:text-[#5a8fc0]"
        >
          <span className="relative inline-block">
            Ver todas las revistas
            <span className="absolute left-0 right-0 bottom-0 h-px origin-left scale-x-0 transition-transform duration-200 ease-out bg-[#1E3A5F] group-hover:scale-x-100" aria-hidden="true" />
          </span>
        </Link>
      </div>
    </section>
  );
}
