'use client';

import dynamic from 'next/dynamic';
import type { Revista } from '../../types/revistas';

const FlipbookClient = dynamic(
  () => import('./FlipbookClient'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen bg-[#1a1a1a]">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    ),
  },
);

export default function FlipbookClientWrapper({ revista }: { revista: Revista }) {
  return <FlipbookClient revista={revista} />;
}
