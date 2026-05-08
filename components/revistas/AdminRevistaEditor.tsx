'use client';

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { collection, doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase/client';
import type { Revista, CategoriaSlug } from '../../types/revistas';
import { CATEGORIA_LABELS, ALL_CATEGORIAS } from '../../types/revistas';

/* ── subcategory data ── */
const SUBCATS: Record<string, { slug: string; label: string }[]> = {
  'consumo-y-retail': [
    { slug: 'fabricantes-y-proveedores',  label: 'Fabricantes y Proveedores' },
    { slug: 'cadenas-comerciales',         label: 'Cadenas Comerciales' },
    { slug: 'negocios-de-conveniencia',    label: 'Negocios de Conveniencia' },
  ],
  'entretenimiento-y-cultura': [
    { slug: 'productoras-de-contenido',    label: 'Productoras de Contenido' },
    { slug: 'promotores-culturales',       label: 'Promotores Culturales' },
    { slug: 'festivales-eventos-y-artistas', label: 'Festivales, Eventos y Artistas' },
  ],
  'industria-ti': [
    { slug: 'canales-de-distribucion',     label: 'Canales de Distribución' },
    { slug: 'fabricantes-de-tecnologia',   label: 'Fabricantes de Tecnología' },
    { slug: 'mayoristas-ti',               label: 'Mayoristas TI' },
  ],
  'infraestructura-social': [
    { slug: 'desarrolladores-de-proyectos', label: 'Desarrolladores de Proyectos' },
    { slug: 'promotores-inmobiliarios',    label: 'Promotores Inmobiliarios' },
    { slug: 'proveedores-de-materiales',   label: 'Proveedores de Materiales' },
  ],
  'politica-y-leyes': [
    { slug: 'administracion-publica',      label: 'Administración Pública' },
    { slug: 'organismos-publicos',         label: 'Organismos Públicos' },
    { slug: 'servicios-juridicos',         label: 'Servicios Jurídicos' },
  ],
  'sector-salud': [
    { slug: 'especialistas-medicos',       label: 'Especialistas Médicos' },
    { slug: 'fabricantes-equipos-insumos', label: 'Fabricantes Equipos e Insumos' },
    { slug: 'instituciones-de-salud',      label: 'Instituciones de Salud' },
  ],
};

/* ── helpers ── */
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

/* ── component ── */
interface Props { existing?: Revista }

export default function AdminRevistaEditor({ existing }: Props) {
  const router = useRouter();

  // Pre-allocate Firestore doc ID so storage paths are known before saving
  const docIdRef = useRef<string>(
    existing?.id ?? (db ? doc(collection(db, 'revistas')).id : crypto.randomUUID())
  );
  const docId = docIdRef.current;

  /* ── form state ── */
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [titulo, setTitulo] = useState(existing?.titulo ?? '');
  const [slug, setSlug] = useState(existing?.slug ?? '');
  const [slugManual, setSlugManual] = useState(!!existing?.slug);
  const [descripcion, setDescripcion] = useState(existing?.descripcion ?? '');
  const [autor, setAutor] = useState(existing?.autor ?? '');
  const [categorias, setCategorias] = useState<CategoriaSlug[]>(existing?.categorias ?? []);
  const [subcategoria, setSubcategoria] = useState(existing?.subcategoria ?? '');
  const [marcaInput, setMarcaInput] = useState('');
  const [marcas, setMarcas] = useState<string[]>(existing?.marcas ?? []);
  const [fechaPublicacion, setFechaPublicacion] = useState(existing?.fechaPublicacion ?? today());

  /* ── preview image ── */
  const previewInputRef = useRef<HTMLInputElement>(null);
  const [previewLocalURL, setPreviewLocalURL] = useState('');
  const [previewStorageURL, setPreviewStorageURL] = useState(existing?.previewURL ?? existing?.portadaURL ?? '');
  const [previewProgress, setPreviewProgress] = useState<number | null>(null);
  const [previewError, setPreviewError] = useState('');

  /* ── PDF ── */
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const pdfFirstPageCanvasRef = useRef<HTMLCanvasElement>(null);
  const pdfFileRef = useRef<File | null>(null);
  const [pdfFileName, setPdfFileName] = useState('');
  const [pdfFileSize, setPdfFileSize] = useState('');
  const [numPages, setNumPages] = useState(existing?.totalPaginas ?? 0);
  const [pdfReady, setPdfReady] = useState((existing?.totalPaginas ?? 0) > 0);
  const [pdfStorageURL, setPdfStorageURL] = useState(existing?.pdfURL ?? '');
  const [pdfUploadProgress, setPdfUploadProgress] = useState<number | null>(null);
  const [pdfError, setPdfError] = useState('');

  /* ── saving ── */
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Auto-slug
  useEffect(() => {
    if (!slugManual) setSlug(slugify(titulo));
  }, [titulo, slugManual]);

  /* ── Preview upload ── */
  const handlePreviewFile = useCallback((file: File) => {
    if (!storage) return;
    if (file.size > 5 * 1024 * 1024) { setPreviewError('Máximo 5 MB.'); return; }
    setPreviewError('');
    const local = URL.createObjectURL(file);
    setPreviewLocalURL(local);
    setPreviewProgress(0);
    setPreviewStorageURL('');
    const storageRef = ref(storage, `revistas/${docId}/preview.jpg`);
    const task = uploadBytesResumable(storageRef, file, { contentType: file.type });
    task.on(
      'state_changed',
      s => setPreviewProgress(Math.round(s.bytesTransferred / s.totalBytes * 100)),
      err => { setPreviewError(err.message); setPreviewProgress(null); },
      async () => { setPreviewStorageURL(await getDownloadURL(task.snapshot.ref)); setPreviewProgress(null); },
    );
  }, [docId]);

  /* ── PDF select: read numPages + first page thumbnail + upload ── */
  const handlePDFFile = useCallback(async (file: File) => {
    if (!storage) return;
    if (file.size > 150 * 1024 * 1024) { setPdfError('Máximo 150 MB.'); return; }
    setPdfError('');
    setPdfReady(false);
    setPdfStorageURL('');
    setNumPages(0);
    pdfFileRef.current = file;
    setPdfFileName(file.name);
    setPdfFileSize((file.size / (1024 * 1024)).toFixed(1) + ' MB');

    try {
      const pdfjsLib = await import('pdfjs-dist');
      (pdfjsLib as any).GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
      const buf = await file.arrayBuffer();
      const pdf = await (pdfjsLib as any).getDocument({ data: buf }).promise;
      setNumPages(pdf.numPages);

      // First-page thumbnail
      if (pdfFirstPageCanvasRef.current) {
        const page = await pdf.getPage(1);
        const vp = page.getViewport({ scale: 0.6 });
        const canvas = pdfFirstPageCanvasRef.current;
        canvas.width = vp.width;
        canvas.height = vp.height;
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
      }
      setPdfReady(true);
    } catch (err: any) {
      setPdfError(err.name === 'PasswordException'
        ? 'El PDF está protegido con contraseña.'
        : 'No se pudo leer el PDF. Verifica que no esté dañado.');
      return;
    }

    // Upload original PDF
    const pdfStorageRef = ref(storage, `revistas/${docId}/revista.pdf`);
    const task = uploadBytesResumable(pdfStorageRef, file, { contentType: 'application/pdf' });
    setPdfUploadProgress(0);
    task.on(
      'state_changed',
      s => setPdfUploadProgress(Math.round(s.bytesTransferred / s.totalBytes * 100)),
      err => { setPdfError(err.message); setPdfUploadProgress(null); },
      async () => { setPdfStorageURL(await getDownloadURL(task.snapshot.ref)); setPdfUploadProgress(null); },
    );
  }, [docId]);

  /* ── Tag helpers ── */
  const addMarca = (v: string) => {
    const t = v.trim();
    if (t && !marcas.includes(t)) setMarcas(prev => [...prev, t]);
    setMarcaInput('');
  };

  /* ── Save ── */
  const handleSave = async (targetEstado: 'borrador' | 'publicada') => {
    if (!db) { setSaveError('Firebase no disponible.'); return; }
    if (!titulo.trim()) { setSaveError('El título es requerido.'); return; }
    if (!slug.trim()) { setSaveError('El slug es requerido.'); return; }
    if (!descripcion.trim()) { setSaveError('La descripción es requerida.'); return; }
    if (!autor.trim()) { setSaveError('El autor es requerido.'); return; }
    if (categorias.length === 0) { setSaveError('Selecciona al menos una categoría.'); return; }
    if (!previewStorageURL) { setSaveError('Sube la imagen de preview antes de guardar.'); return; }

    setSaving(true);
    setSaveError('');

    try {
      const data: Record<string, any> = {
        titulo: titulo.trim(),
        slug: slug.trim(),
        descripcion: descripcion.trim(),
        autor: autor.trim(),
        subcategoria: subcategoria.trim() || null,
        categorias,
        marcas,
        fechaPublicacion,
        estado: targetEstado,
        previewURL: previewStorageURL,
        portadaURL: previewStorageURL,
        pdfURL: pdfStorageURL || null,
        totalPaginas: numPages,
        updatedAt: serverTimestamp(),
      };

      if (existing) {
        await updateDoc(doc(db, 'revistas', existing.id), data);
      } else {
        await setDoc(doc(db, 'revistas', docId), { ...data, createdAt: serverTimestamp() });
      }
      router.push('/admin/revistas');
    } catch (err: any) {
      setSaveError(err.message || 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const isUploading = previewProgress !== null || pdfUploadProgress !== null;

  /* ── JSX ── */
  return (
    <div className="flex flex-col gap-6">

      {/* Título + Slug */}
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

      {/* Descripción */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Descripción *</label>
          <span className={`text-xs ${descripcion.length > 160 ? 'text-rose-500' : 'text-slate-400'}`}>
            {descripcion.length}/160
          </span>
        </div>
        <textarea
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
          maxLength={160}
          rows={3}
          placeholder="Breve descripción de la revista..."
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
        />
      </div>

      {/* Autor */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Autor *</label>
        <input
          value={autor}
          onChange={e => setAutor(e.target.value)}
          placeholder="Nombre del autor o equipo editorial"
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
        />
      </div>

      {/* Categorías + Subcategorías (dropdown) */}
      {openCat && <div className="fixed inset-0 z-10" onClick={() => setOpenCat(null)} />}
      <div className="flex flex-col gap-3">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Categorías *</label>
        <div className="flex flex-wrap gap-2">
          {ALL_CATEGORIAS.map(cat => {
            const isSelected = categorias.includes(cat);
            const isOpen = openCat === cat;
            const catSubcats = SUBCATS[cat] ?? [];
            return (
              <div key={cat} className="relative z-20">
                <button
                  type="button"
                  onClick={() => setOpenCat(isOpen ? null : cat)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                    isSelected ? 'bg-[#1E3A5F] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {CATEGORIA_LABELS[cat]}
                  <svg
                    width="10" height="10" viewBox="0 0 10 10" fill="currentColor"
                    className={`transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
                  >
                    <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                  </svg>
                </button>

                {isOpen && (
                  <div className="absolute left-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[220px]">
                    {catSubcats.map(sub => {
                      const isActiveSub = subcategoria === sub.label;
                      return (
                        <button
                          key={sub.slug}
                          type="button"
                          onClick={() => {
                            setCategorias(prev => prev.includes(cat) ? prev : [...prev, cat]);
                            setSubcategoria(isActiveSub ? '' : sub.label);
                            setOpenCat(null);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition flex items-center justify-between ${
                            isActiveSub
                              ? 'text-[#1E3A5F] font-semibold bg-[#1E3A5F]/5'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {sub.label}
                          {isActiveSub && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </button>
                      );
                    })}
                    {isSelected && (
                      <>
                        <div className="mx-3 my-1 border-t border-slate-100" />
                        <button
                          type="button"
                          onClick={() => {
                            setCategorias(prev => prev.filter(c => c !== cat));
                            if (catSubcats.some(s => s.label === subcategoria)) setSubcategoria('');
                            setOpenCat(null);
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-rose-500 hover:bg-rose-50 transition"
                        >
                          Quitar categoría
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Active filters summary */}
        {(categorias.length > 0 || subcategoria) && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {subcategoria && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-[#1E3A5F]/10 text-[#1E3A5F] rounded-full font-semibold">
                {subcategoria}
                <button type="button" onClick={() => setSubcategoria('')} className="hover:text-rose-500 leading-none">✕</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Fecha de publicación */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Fecha de publicación *</label>
        <input
          type="date"
          value={fechaPublicacion}
          onChange={e => setFechaPublicacion(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F] max-w-xs"
        />
      </div>

      {/* Live preview — appears once a category is selected */}
      {categorias.length > 0 && (
        <div className="flex flex-col gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Vista previa · {CATEGORIA_LABELS[categorias[0]]}
            {subcategoria && <span className="text-slate-300"> / {subcategoria}</span>}
          </p>
          {/* Mini carousel — 2 placeholder articles + magazine card */}
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
            {/* Placeholder article left */}
            <div className="flex-shrink-0 w-[155px] rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden opacity-40">
              <div className="h-[80px] bg-slate-200 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
              </div>
              <div className="p-2 space-y-1.5">
                <div className="h-2 bg-slate-200 rounded w-5/6" />
                <div className="h-2 bg-slate-200 rounded w-3/4" />
                <div className="h-1.5 bg-slate-100 rounded w-1/2 mt-2" />
              </div>
            </div>

            {/* Magazine card — live data */}
            <div className="flex-shrink-0 w-[155px] rounded-xl border-2 border-[#1E3A5F]/40 bg-white shadow-md overflow-hidden">
              <div className="relative h-[80px] bg-slate-100 overflow-hidden">
                {(previewLocalURL || previewStorageURL) ? (
                  <img
                    src={previewLocalURL || previewStorageURL}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  </div>
                )}
                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wide bg-[#1E3A5F] text-white rounded-sm leading-none">
                  REVISTA
                </span>
              </div>
              <div className="p-2">
                <p className="text-[9.5px] font-semibold text-slate-800 line-clamp-2 leading-tight">
                  {titulo || 'Título de la revista'}
                </p>
                {subcategoria && (
                  <p className="text-[7.5px] text-slate-400 italic mt-0.5">{subcategoria}</p>
                )}
                <p className="text-[7.5px] text-slate-400 mt-1">{fechaPublicacion}</p>
              </div>
            </div>

            {/* Placeholder article right */}
            <div className="flex-shrink-0 w-[155px] rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden opacity-40">
              <div className="h-[80px] bg-slate-200 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
              </div>
              <div className="p-2 space-y-1.5">
                <div className="h-2 bg-slate-200 rounded w-4/6" />
                <div className="h-2 bg-slate-200 rounded w-5/6" />
                <div className="h-1.5 bg-slate-100 rounded w-2/5 mt-2" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Marcas */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Marcas Destacadas</label>
        {marcas.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {marcas.map(m => (
              <span key={m} className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded-full text-xs text-slate-700">
                {m}
                <button type="button" onClick={() => setMarcas(prev => prev.filter(x => x !== m))} className="text-slate-400 hover:text-rose-500 leading-none">✕</button>
              </span>
            ))}
          </div>
        )}
        <input
          value={marcaInput}
          onChange={e => setMarcaInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addMarca(marcaInput); } }}
          onBlur={() => marcaInput.trim() && addMarca(marcaInput)}
          placeholder="Escribe y presiona Enter o coma para agregar"
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
        />
      </div>

      {/* Preview image */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Imagen de Preview *</label>
        <p className="text-xs text-slate-400">Se mostrará a 600×600px en listados · JPG, PNG, WebP · máx. 5 MB</p>
        <input
          ref={previewInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={e => e.target.files?.[0] && handlePreviewFile(e.target.files[0])}
        />
        {(previewLocalURL || previewStorageURL) ? (
          <div className="flex gap-4 items-start">
            <div className="w-28 h-28 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shrink-0">
              <img src={previewLocalURL || previewStorageURL} alt="Preview" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col gap-2 pt-1">
              {previewStorageURL
                ? <p className="text-xs text-emerald-600 font-medium">✓ Imagen lista</p>
                : previewProgress !== null
                ? <div className="flex flex-col gap-1 w-28">
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#1E3A5F] transition-all" style={{ width: `${previewProgress}%` }} />
                    </div>
                    <p className="text-xs text-slate-400">Subiendo {previewProgress}%</p>
                  </div>
                : null
              }
              <button type="button" onClick={() => previewInputRef.current?.click()} className="text-xs text-slate-500 underline hover:text-slate-700">
                Cambiar imagen
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => previewInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center gap-2 hover:border-[#1E3A5F] hover:bg-slate-50 transition w-40 text-center"
          >
            <span className="text-2xl">🖼️</span>
            <span className="text-xs font-medium text-slate-600">Subir imagen</span>
          </button>
        )}
        {previewError && <p className="text-xs text-rose-600">{previewError}</p>}
      </div>

      {/* PDF upload */}
      <div className="flex flex-col gap-3">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">PDF de la Revista *</label>
        <p className="text-xs text-slate-400">Solo PDF · máx. 150 MB</p>
        <input
          ref={pdfInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={e => e.target.files?.[0] && handlePDFFile(e.target.files[0])}
        />

        {pdfFileName ? (
          <div className="flex gap-4 items-start bg-slate-50 border border-slate-200 rounded-xl p-4">
            {/* First-page thumbnail */}
            <canvas
              ref={pdfFirstPageCanvasRef}
              className="rounded shadow shrink-0 border border-slate-200"
              style={{ height: 100, width: 'auto' }}
            />
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{pdfFileName}</p>
              <p className="text-xs text-slate-500">{pdfFileSize}</p>
              {pdfReady && numPages > 0 && (
                <p className="text-xs text-emerald-600 font-semibold">✓ {numPages} páginas detectadas</p>
              )}
              {pdfUploadProgress !== null ? (
                <div className="flex flex-col gap-1">
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-[#1E3A5F] transition-all" style={{ width: `${pdfUploadProgress}%` }} />
                  </div>
                  <p className="text-xs text-slate-400">Subiendo PDF... {pdfUploadProgress}%</p>
                </div>
              ) : pdfStorageURL ? (
                <p className="text-xs text-emerald-600 font-semibold">✓ PDF subido</p>
              ) : null}
              <button type="button" onClick={() => pdfInputRef.current?.click()} className="text-xs text-slate-500 underline hover:text-slate-700 w-fit">
                Cambiar PDF
              </button>
            </div>
          </div>
        ) : existing?.pdfURL ? (
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
            <span className="text-2xl">📄</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700">PDF existente · {existing.totalPaginas} páginas</p>
              <p className="text-xs text-slate-400 mt-0.5">Puedes reemplazarlo seleccionando un nuevo archivo</p>
            </div>
            <button type="button" onClick={() => pdfInputRef.current?.click()} className="text-xs text-slate-500 underline hover:text-slate-700 shrink-0">
              Reemplazar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => pdfInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex items-center gap-3 hover:border-[#1E3A5F] hover:bg-slate-50 transition"
          >
            <span className="text-2xl">📄</span>
            <div className="text-left">
              <p className="text-sm font-medium text-slate-600">Subir PDF de la revista</p>
              <p className="text-xs text-slate-400">Arrastra o haz clic para seleccionar</p>
            </div>
          </button>
        )}
        {pdfError && <p className="text-xs text-rose-600 bg-rose-50 px-3 py-2 rounded-lg">{pdfError}</p>}
      </div>

      {/* Save error */}
      {saveError && (
        <p className="text-sm text-rose-600 bg-rose-50 px-4 py-2.5 rounded-lg border border-rose-100">{saveError}</p>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <a href="/admin/revistas" className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition">
          ← Cancelar
        </a>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleSave('borrador')}
            disabled={saving || isUploading}
            className="px-4 py-2 text-sm border border-[#1E3A5F] text-[#1E3A5F] rounded-lg font-medium hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Guardando...' : 'Guardar borrador'}
          </button>
          <button
            type="button"
            onClick={() => handleSave('publicada')}
            disabled={saving || isUploading}
            className="px-5 py-2 text-sm bg-[#1E3A5F] text-white rounded-lg font-bold hover:bg-[#16304e] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {saving ? 'Publicando...' : 'Publicar revista'}
          </button>
        </div>
      </div>
    </div>
  );
}
