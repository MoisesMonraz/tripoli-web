import { getRevista } from '../../../lib/revistas';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import FlipbookClient from '../../../components/revistas/FlipbookClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const revista = await getRevista(slug);
  if (!revista) return { title: 'Revista no encontrada | Tripoli Media' };
  return {
    title: `${revista.titulo} — Tripoli Media`,
    description: revista.descripcion || `Lee ${revista.titulo} en Tripoli Media.`,
    openGraph: {
      title: revista.titulo,
      description: revista.descripcion,
      images: revista.portadaURL ? [{ url: revista.portadaURL }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: revista.titulo,
      description: revista.descripcion,
      images: revista.portadaURL ? [revista.portadaURL] : [],
    },
  };
}

export default async function RevistaPage({ params }: Props) {
  const { slug } = await params;
  const revista = await getRevista(slug);
  if (!revista || revista.estado === 'borrador') notFound();
  return <FlipbookClient revista={revista} />;
}
