'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  collection, doc, addDoc, updateDoc, serverTimestamp,
} from 'firebase/firestore';
import {
  ref, uploadBytesResumable, getDownloadURL, deleteObject,
} from 'firebase/storage';
import { db, storage } from '../../lib/firebase/client';
import type { Revista, PageItem, CategoriaSlug } from '../../types/revistas';
import { CATEGORIA_LABELS, ALL_CATEGORIAS } from '../../types/revistas';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, arrayMove, rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/* ---------- helpers ---------- */

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

/* ---------- sortable page item ---------- */

interface SortablePageProps {
  id: string;
  page: PageItem;
  idx: number;
  onRemove: (orden: number) => void;
}

function SortablePage({ id, page, idx, onRemove }: SortablePageProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative group rounded-lg overflow-hidden border-2 ${isDragging ? 'border-[#1E3A5F] shadow-xl z-10' : 'border-transparent'}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute inset-0 cursor-grab active:cursor-grabbing z-10"
      />
      <div className="relative w-full" style={{ paddingBottom: '133.33%' }}>
        <img src={page.imageURL} alt={page.descripcionAlt || `Página ${idx + 1}`} className="absolute inset-0 w-full h-full object-cover" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 flex items-center justify-between">
        <span className="text-white text-[10px]">Pág. {idx + 1}</span>
        <button
          onClick={() => onRemove(page.orden)}
          className="text-rose-400 hover:text-rose-200 text-[10px] z-20 relative"
          type="button"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/* ---------- upload progress item ---------- */

interface UploadItem {
  file: File;
  progress: number;
  url?: string;
  error?: string;
  id: string;
}

/* ---------- main editor ---------- */

interface Props {
  existing?: Revista;
}

const STEPS = ['Información', 'Portada', 'Páginas', 'Confirmar'] as const;
type Step = 0 | 1 | 2 | 3;

export default function AdminRevistaEditor({ existing }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  /* --- step 1: basic info --- */
  const [titulo, setTitulo] = useState(existing?.titulo ?? '');
  const [descripcion, setDescripcion] = useState(existing?.descripcion ?? '');
  const [slug, setSlug] = useState(existing?.slug ?? '');
  const [slugManual, setSlugManual] = useState(!!existing?.slug);
  const [categorias, setCategorias] = useState<CategoriaSlug[]>(existing?.categorias ?? []);
  const [marcas, setMarcas] = useState(existing?.marcas?.join(', ') ?? '');
  const [fechaPublicacion, setFechaPublicacion] = useState(existing?.fechaPublicacion ?? today());
  const [estado, setEstado] = useState<'borrador' | 'publicada'>(existing?.estado ?? 'borrador');

  /* --- step 2: cover --- */
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [coverURL, setCoverURL] = useState(existing?.portadaURL ?? '');
  const [coverProgress, setCoverProgress] = useState<number | null>(null);
  const [coverError, setCoverError] = useState('');

  /* --- step 3: pages --- */
  const pagesInputRef = useRef<HTMLInputElement>(null);
  const [pages, setPages] = useState<PageItem[]>(existing?.paginas ?? []);
  const [uploads, setUploads] = useState<UploadItem[]>([]);

  const sensors = useSensors(useSensor(PointerSensor));

  /* auto-slug from titulo */
  useEffect(() => {
    if (!slugManual) setSlug(slugify(titulo));
  }, [titulo, slugManual]);

  /* --- cover upload --- */
  const uploadCover = useCallback((file: File) => {
    if (!storage) return;
    setCoverError('');
    setCoverProgress(0);
    const storageRef = ref(storage, `revistas/covers/${Date.now()}_${file.name}`);
    const task = uploadBytesResumable(storageRef, file);
    task.on('state_changed',
      snap => setCoverProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
      err => { setCoverError(err.message); setCoverProgress(null); },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        setCoverURL(url);
        setCoverProgress(null);
      },
    );
  }, []);

  /* --- page uploads --- */
  const uploadPages = useCallback((files: FileList) => {
    if (!storage) return;
    const items: UploadItem[] = Array.from(files).map(f => ({
      file: f, progress: 0, id: `${Date.now()}_${Math.random()}`,
    }));
    setUploads(prev => [...prev, ...items]);
    items.forEach(item => {
      const storageRef = ref(storage!, `revistas/pages/${Date.now()}_${item.file.name}`);
      const task = uploadBytesResumable(storageRef, item.file);
      task.on('state_changed',
        snap => {
          const p = Math.round(snap.bytesTransferred / snap.totalBytes * 100);
          setUploads(prev => prev.map(u => u.id === item.id ? { ...u, progress: p } : u));
        },
        err => {
          setUploads(prev => prev.map(u => u.id === item.id ? { ...u, error: err.message } : u));
        },
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          const nextOrden = pages.length + 1;
          const newPage: PageItem = { orden: nextOrden, imageURL: url, descripcionAlt: '' };
          setPages(prev => {
            const updated = [...prev, { ...newPage, orden: prev.length + 1 }];
            return updated;
          });
          setUploads(prev => prev.filter(u => u.id !== item.id));
        },
      );
    });
  }, [pages.length]);

  const removePage = (orden: number) => {
    setPages(prev => {
      const filtered = prev.filter(p => p.orden !== orden);
      return filtered.map((p, i) => ({ ...p, orden: i + 1 }));
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setPages(prev => {
      const oldIdx = prev.findIndex(p => String(p.orden) === active.id);
      const newIdx = prev.findIndex(p => String(p.orden) === over.id);
      const reordered = arrayMove(prev, oldIdx, newIdx);
      return reordered.map((p, i) => ({ ...p, orden: i + 1 }));
    });
  };

  /* --- save --- */
  const handleSave = async () => {
    if (!db) { setSaveError('Firebase no está disponible.'); return; }
    setSaving(true);
    setSaveError('');
    const marcasArr = marcas.split(',').map(s => s.trim()).filter(Boolean);
    const data = {
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      slug: slug.trim(),
      categorias,
      marcas: marcasArr,
      fechaPublicacion,
      estado,
      portadaURL: coverURL,
      paginas: pages,
      totalPaginas: pages.length,
      updatedAt: serverTimestamp(),
    };
    try {
      if (existing) {
        await updateDoc(doc(db, 'revistas', existing.id), data);
      } else {
        await addDoc(collection(db, 'revistas'), { ...data, createdAt: serverTimestamp() });
      }
      router.push('/admin/revistas');
    } catch (err: any) {
      setSaveError(err.message || 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  /* --- validation per step --- */
  const canProceed: Record<Step, boolean> = {
    0: titulo.trim().length >= 2 && slug.trim().length >= 2 && categorias.length > 0,
    1: true,
    2: true,
    3: true,
  };

  /* ===================== render ===================== */
  return (
    <div className="flex flex-col gap-6">

      {/* Steps nav */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => i < step ? setStep(i as Step) : undefined}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition ${
              step === i
                ? 'text-[#1E3A5F] border-b-2 border-[#1E3A5F]'
                : i < step
                ? 'text-emerald-600 border-b-2 border-emerald-200 cursor-pointer hover:text-emerald-700'
                : 'text-slate-400 border-b-2 border-transparent cursor-default'
            }`}
          >
            <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${
              step === i ? 'bg-[#1E3A5F] text-white' : i < step ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
            }`}>
              {i < step ? '✓' : i + 1}
            </span>
            <span className="hidden sm:inline">{s}</span>
          </button>
        ))}
      </div>

      {/* ---- Step 0: Info ---- */}
      {step === 0 && (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Título *</label>
              <input
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                placeholder="Ej: Revista Tripoli Abril 2026"
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Slug *</label>
              <input
                value={slug}
                onChange={e => { setSlug(e.target.value); setSlugManual(true); }}
                placeholder="revista-tripoli-abril-2026"
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
              />
              <p className="text-[10px] text-slate-400">URL: /revistas/{slug || '...'}</p>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Descripción</label>
            <textarea
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              rows={3}
              placeholder="Breve descripción del contenido..."
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F] resize-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Categorías *</label>
            <div className="flex flex-wrap gap-2">
              {ALL_CATEGORIAS.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategorias(prev =>
                    prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
                  )}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                    categorias.includes(cat)
                      ? 'bg-[#1E3A5F] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {CATEGORIA_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Marcas (separadas por coma)</label>
              <input
                value={marcas}
                onChange={e => setMarcas(e.target.value)}
                placeholder="Marca A, Marca B"
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Fecha de publicación</label>
              <input
                type="date"
                value={fechaPublicacion}
                onChange={e => setFechaPublicacion(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Estado</label>
            <div className="flex gap-3">
              {(['borrador', 'publicada'] as const).map(e => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEstado(e)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    estado === e
                      ? e === 'publicada' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {e === 'publicada' ? 'Publicada' : 'Borrador'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---- Step 1: Cover ---- */}
      {step === 1 && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-500">Sube la imagen de portada de la revista (recomendado: 600×800 px o proporción 3:4).</p>

          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => e.target.files?.[0] && uploadCover(e.target.files[0])}
          />

          {coverURL ? (
            <div className="flex gap-4 items-start">
              <div className="relative w-32 shrink-0" style={{ paddingBottom: '42.65%' }}>
                <img src={coverURL} alt="Portada" className="absolute inset-0 w-full h-full object-cover rounded-xl shadow-md" />
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <p className="text-sm text-emerald-600 font-medium">✓ Portada subida</p>
                <button
                  type="button"
                  onClick={() => { setCoverURL(''); coverInputRef.current?.click(); }}
                  className="text-xs text-slate-500 underline hover:text-slate-700"
                >
                  Cambiar imagen
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center gap-2 hover:border-[#1E3A5F] hover:bg-slate-50 transition text-center"
            >
              <span className="text-3xl">🖼️</span>
              <span className="text-sm font-medium text-slate-600">Haz clic para subir portada</span>
              <span className="text-xs text-slate-400">JPG, PNG, WebP · máx. 5 MB</span>
            </button>
          )}

          {coverProgress !== null && (
            <div className="flex flex-col gap-1">
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#1E3A5F] rounded-full transition-all" style={{ width: `${coverProgress}%` }} />
              </div>
              <p className="text-xs text-slate-400">Subiendo... {coverProgress}%</p>
            </div>
          )}
          {coverError && <p className="text-xs text-rose-600 bg-rose-50 px-3 py-2 rounded-lg">{coverError}</p>}
        </div>
      )}

      {/* ---- Step 2: Pages ---- */}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-500">
            Sube las páginas de la revista. Puedes arrastrar para reordenarlas.
            {pages.length > 0 && <span className="font-medium text-slate-700"> ({pages.length} páginas)</span>}
          </p>

          <input
            ref={pagesInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => e.target.files && e.target.files.length > 0 && uploadPages(e.target.files)}
          />

          <button
            type="button"
            onClick={() => pagesInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-xl p-5 flex items-center gap-3 hover:border-[#1E3A5F] hover:bg-slate-50 transition"
          >
            <span className="text-2xl">📄</span>
            <div className="text-left">
              <p className="text-sm font-medium text-slate-600">Agregar páginas</p>
              <p className="text-xs text-slate-400">Selecciona una o varias imágenes a la vez</p>
            </div>
          </button>

          {/* Active uploads progress */}
          {uploads.length > 0 && (
            <div className="flex flex-col gap-2">
              {uploads.map(u => (
                <div key={u.id} className="flex items-center gap-3">
                  <p className="text-xs text-slate-500 truncate flex-1">{u.file.name}</p>
                  <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                    <div className="h-full bg-[#1E3A5F] transition-all" style={{ width: `${u.progress}%` }} />
                  </div>
                  <span className="text-xs text-slate-400 w-8 text-right">{u.progress}%</span>
                </div>
              ))}
            </div>
          )}

          {/* Pages grid with DnD */}
          {pages.length > 0 && (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={pages.map(p => String(p.orden))} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {pages.map((p, i) => (
                    <SortablePage
                      key={String(p.orden)}
                      id={String(p.orden)}
                      page={p}
                      idx={i}
                      onRemove={removePage}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}

      {/* ---- Step 3: Confirm ---- */}
      {step === 3 && (
        <div className="flex flex-col gap-5">
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 flex flex-col gap-3">
            <div className="flex gap-4 items-start">
              {coverURL && (
                <img src={coverURL} alt="Portada" className="w-20 rounded-lg shadow object-cover shrink-0" style={{ aspectRatio: '3/4' }} />
              )}
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-bold text-slate-900">{titulo}</h2>
                <p className="text-xs text-slate-500 font-mono">/revistas/{slug}</p>
                {descripcion && <p className="text-sm text-slate-600 mt-1">{descripcion}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-0.5">Categorías</p>
                <div className="flex flex-wrap gap-1">
                  {categorias.map(c => (
                    <span key={c} className="text-[10px] bg-[#1E3A5F]/10 text-[#1E3A5F] px-1.5 py-0.5 rounded">
                      {CATEGORIA_LABELS[c]}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-0.5">Páginas</p>
                <p className="font-semibold text-slate-700">{pages.length}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-0.5">Publicación</p>
                <p className="font-semibold text-slate-700">{fechaPublicacion}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-0.5">Estado</p>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                  estado === 'publicada' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {estado === 'publicada' ? 'Publicada' : 'Borrador'}
                </span>
              </div>
            </div>
          </div>

          {saveError && (
            <p className="text-sm text-rose-600 bg-rose-50 px-4 py-2 rounded-lg border border-rose-100">{saveError}</p>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="self-end rounded-xl bg-[#1E3A5F] px-6 py-3 text-sm font-bold text-white hover:bg-[#16304e] transition shadow-lg disabled:opacity-60"
          >
            {saving ? 'Guardando...' : existing ? 'Guardar cambios' : 'Crear revista'}
          </button>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={() => step > 0 ? setStep((step - 1) as Step) : router.push('/admin/revistas')}
          className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
        >
          {step === 0 ? '← Cancelar' : '← Anterior'}
        </button>
        {step < 3 && (
          <button
            type="button"
            onClick={() => canProceed[step] && setStep((step + 1) as Step)}
            disabled={!canProceed[step]}
            className="px-5 py-2 rounded-lg bg-[#1E3A5F] text-sm font-semibold text-white hover:bg-[#16304e] transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Siguiente →
          </button>
        )}
      </div>
    </div>
  );
}
