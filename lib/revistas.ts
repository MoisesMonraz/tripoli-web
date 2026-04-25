import 'server-only';
import { db } from './firebase/server';
import type { Revista, CategoriaSlug } from '../types/revistas';

function docToRevista(doc: FirebaseFirestore.DocumentSnapshot): Revista {
  const d = doc.data()!;
  return {
    id: doc.id,
    slug: d.slug ?? '',
    titulo: d.titulo ?? '',
    descripcion: d.descripcion ?? '',
    portadaURL: d.portadaURL ?? '',
    categorias: d.categorias ?? [],
    paginas: (d.paginas ?? []).sort((a: any, b: any) => a.orden - b.orden),
    marcas: d.marcas ?? [],
    fechaPublicacion: d.fechaPublicacion ?? '',
    estado: d.estado ?? 'borrador',
    totalPaginas: d.totalPaginas ?? 0,
    createdAt: d.createdAt ?? null,
    updatedAt: d.updatedAt ?? null,
  };
}

export interface GetRevistasOptions {
  categoria?: CategoriaSlug;
  incluirBorradores?: boolean;
}

export async function getRevistas(opts: GetRevistasOptions = {}): Promise<Revista[]> {
  if (!db) return [];
  try {
    let q: FirebaseFirestore.Query = db.collection('revistas');
    if (!opts.incluirBorradores) {
      q = q.where('estado', '==', 'publicada');
    }
    if (opts.categoria) {
      q = q.where('categorias', 'array-contains', opts.categoria);
    }
    q = q.orderBy('fechaPublicacion', 'desc');
    const snap = await q.get();
    return snap.docs.map(docToRevista);
  } catch {
    return [];
  }
}

export async function getRevista(slug: string): Promise<Revista | null> {
  if (!db) return null;
  try {
    const snap = await db.collection('revistas').where('slug', '==', slug).limit(1).get();
    if (snap.empty) return null;
    return docToRevista(snap.docs[0]);
  } catch {
    return null;
  }
}

export async function getAllRevistasForSearch(): Promise<Pick<Revista, 'id' | 'slug' | 'titulo' | 'descripcion' | 'marcas' | 'portadaURL'>[]> {
  if (!db) return [];
  try {
    const snap = await db.collection('revistas').where('estado', '==', 'publicada').get();
    return snap.docs.map(doc => {
      const d = doc.data();
      return { id: doc.id, slug: d.slug, titulo: d.titulo, descripcion: d.descripcion, marcas: d.marcas ?? [], portadaURL: d.portadaURL };
    });
  } catch {
    return [];
  }
}
