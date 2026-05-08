import { getRevista, getRevistas } from '../../../lib/revistas';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import FlipbookClientWrapper from '../../../components/revistas/FlipbookClientWrapper';

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const revistas = await getRevistas();
    return revistas.map((r) => ({ slug: r.slug }));
  } catch {
    return [];
  }
}

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
  return <FlipbookClientWrapper revista={revista} />;
}
