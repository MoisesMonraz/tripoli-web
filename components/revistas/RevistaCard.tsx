import Link from 'next/link';
import Image from 'next/image';
import type { Revista } from '../../types/revistas';
import { CATEGORIA_LABELS } from '../../types/revistas';

function formatDate(iso: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${months[parseInt(m) - 1]} ${d}, ${y}`;
}

interface Props {
  revista: Revista;
  compact?: boolean;
}

export default function RevistaCard({ revista, compact = false }: Props) {
  return (
    <Link href={`/revistas/${revista.slug}`} className="group block">
      <div className={`relative overflow-hidden rounded-xl shadow-md transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl bg-slate-800 ${compact ? 'w-44' : 'w-full'}`}>
        {/* Cover image — 3:4 portrait ratio */}
        <div className="relative w-full" style={{ paddingBottom: '133.33%' }}>
          {revista.portadaURL ? (
            <Image
              src={revista.portadaURL}
              alt={revista.titulo}
              fill
              className="object-cover"
              sizes={compact ? '176px' : '(max-width:768px) 100vw, 33vw'}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-700">
              <span className="text-slate-400 text-sm">Sin portada</span>
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          {/* Bottom info */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className={`font-bold text-white leading-tight line-clamp-2 ${compact ? 'text-xs' : 'text-sm'}`}>
              {revista.titulo}
            </h3>
            {!compact && (
              <>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {revista.categorias.slice(0, 2).map(cat => (
                    <span key={cat} className="text-[9px] font-semibold uppercase tracking-wide bg-white/20 text-white px-1.5 py-0.5 rounded-full">
                      {CATEGORIA_LABELS[cat]}
                    </span>
                  ))}
                </div>
                <p className="text-white/60 text-[10px] mt-1">{formatDate(revista.fechaPublicacion)}</p>
              </>
            )}
          </div>
        </div>
        {/* CTA */}
        {!compact && (
          <div className="bg-[#1E3A5F] px-3 py-2 text-center">
            <span className="text-xs font-semibold text-white uppercase tracking-wide">Ver revista</span>
          </div>
        )}
      </div>
    </Link>
  );
}
