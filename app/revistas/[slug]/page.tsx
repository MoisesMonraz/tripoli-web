import { notFound } from "next/navigation";
import { getRevista, getRevistas } from "@/lib/revistas";
import FlipbookClientWrapper from "@/components/revistas/FlipbookClientWrapper";
import type { Metadata } from "next";

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const revistas = await getRevistas();
    return revistas.map((r) => ({ slug: r.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  try {
    const revista = await getRevista(params.slug);
    if (!revista) return {};
    return {
      title: `${revista.titulo} | Revistas | Tripoli Media`,
      description: revista.descripcion,
      openGraph: revista.ogUrl
        ? { images: [{ url: revista.ogUrl }] }
        : undefined,
    };
  } catch {
    return {};
  }
}

export default async function RevistaPage({
  params,
}: {
  params: { slug: string };
}) {
  const revista = await getRevista(params.slug);
  if (!revista) notFound();

  return (
    <FlipbookClientWrapper pdfUrl={revista.pdfUrl} titulo={revista.titulo} />
  );
}
