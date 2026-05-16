import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { getRevista, getRevistas } from "@/lib/revistas";
import FlipbookClientWrapper from "@/components/revistas/FlipbookClientWrapper";
import type { Metadata } from "next";

export const revalidate = false;

export async function generateStaticParams() {
  try {
    const revistas = await getRevistas();
    return revistas
      .filter((r) => r.categoria?.slug && r.subcategoria?.slug)
      .map((r) => ({
        category: r.categoria.slug,
        subcategory: r.subcategoria!.slug,
        slug: r.slug,
      }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: { category: string; subcategory: string; slug: string };
}): Promise<Metadata> {
  try {
    const revista = await getRevista(params.slug);
    if (!revista) return {};
    return {
      title: `${revista.titulo} — Tripoli Media`,
      description: revista.descripcion,
      openGraph: revista.ogUrl ? { images: [{ url: revista.ogUrl }] } : undefined,
    };
  } catch {
    return {};
  }
}

export default async function RevistaPage({
  params,
}: {
  params: { category: string; subcategory: string; slug: string };
}) {
  const revista = await getRevista(params.slug);

  if (!revista) notFound();

  // Canonical URL verification — redirect if slugs don't match
  const catSlug = revista.categoria?.slug ?? "";
  const subcatSlug = revista.subcategoria?.slug ?? "";

  if (catSlug !== params.category || subcatSlug !== params.subcategory) {
    if (catSlug && subcatSlug) {
      redirect(`/${catSlug}/${subcatSlug}/revista/${revista.slug}`);
    }
    notFound();
  }

  return (
    <FlipbookClientWrapper pdfUrl={revista.pdfUrl} titulo={revista.titulo} />
  );
}
