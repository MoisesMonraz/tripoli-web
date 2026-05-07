'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import type { Revista } from '../../types/revistas';
import { CATEGORIA_LABELS } from '../../types/revistas';

interface Props { revista: Revista; }

function formatDate(iso: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${months[parseInt(m) - 1]} ${d}, ${y}`;
}

function getSpread(page: number, total: number): { left: number | null; right: number | null } {
  if (page === 1) return { left: null, right: 1 };
  const left = page % 2 === 0 ? page : page - 1;
  const right = left + 1 <= total ? left + 1 : null;
  return { left, right };
}

export default function FlipbookClient({ revista }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const thumbsRef = useRef<Map<number, string>>(new Map());

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [totalPages, setTotalPages] = useState(revista.totalPaginas || 0);
  const [currentPage, setCurrentPage] = useState(1);
  const [spreadMode, setSpreadMode] = useState(false);
  const [showThumbs, setShowThumbs] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [rendering, setRendering] = useState(false);
  const [copied, setCopied] = useState(false);
  const [thumbsReady, setThumbsReady] = useState(0);

  // ── PDF loading ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!revista.pdfURL) { setLoadError('No hay PDF disponible.'); setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
        const doc = await pdfjsLib.getDocument({ url: revista.pdfURL }).promise;
        if (cancelled) return;
        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        setLoading(false);
        // Generate thumbnails in background
        generateThumbs(doc, doc.numPages);
      } catch (e) {
        if (!cancelled) { setLoadError('Error al cargar el PDF.'); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [revista.pdfURL]);

  const generateThumbs = async (doc: any, total: number) => {
    for (let i = 1; i <= total; i++) {
      try {
        const page = await doc.getPage(i);
        const vp = page.getViewport({ scale: 0.3 });
        const canvas = document.createElement('canvas');
        canvas.width = vp.width; canvas.height = vp.height;
        await page.render({ canvasContext: canvas.getContext('2d')!, viewport: vp }).promise;
        thumbsRef.current.set(i, canvas.toDataURL('image/jpeg', 0.7));
        setThumbsReady(i);
      } catch { /* skip */ }
    }
  };

  // ── Page rendering ───────────────────────────────────────────────────────
  const renderPage = useCallback(async (doc: any, pageNum: number, container: HTMLElement) => {
    if (!doc || !container) return;
    setRendering(true);
    container.innerHTML = '';
    try {
      const dpr = window.devicePixelRatio || 1;
      const containerW = container.offsetWidth || 800;
      const page = await doc.getPage(pageNum);
      const naturalVP = page.getViewport({ scale: 1 });
      const cssScale = containerW / naturalVP.width;
      const cssVP = page.getViewport({ scale: cssScale });
      const renderVP = page.getViewport({ scale: cssScale * dpr * 1.5 });

      const wrapper = document.createElement('div');
      wrapper.style.cssText = `position:relative;width:${cssVP.width}px;height:${cssVP.height}px;`;

      const canvas = document.createElement('canvas');
      canvas.width = renderVP.width; canvas.height = renderVP.height;
      canvas.style.cssText = `position:absolute;top:0;left:0;width:${cssVP.width}px;height:${cssVP.height}px;display:block;`;

      const ctx = canvas.getContext('2d')!;
      await page.render({ canvasContext: ctx, viewport: renderVP }).promise;

      // Text layer
      const textDiv = document.createElement('div');
      textDiv.className = 'pdfTextLayer';
      textDiv.style.cssText = `position:absolute;top:0;left:0;width:${cssVP.width}px;height:${cssVP.height}px;overflow:hidden;line-height:1;`;
      const textContent = await page.getTextContent();
      const { renderTextLayer } = await import('pdfjs-dist');
      await renderTextLayer({ textContentSource: textContent, container: textDiv, viewport: cssVP, textDivs: [] }).promise;

      // Annotation layer (manual links)
      const annotDiv = document.createElement('div');
      annotDiv.style.cssText = `position:absolute;top:0;left:0;width:${cssVP.width}px;height:${cssVP.height}px;pointer-events:none;`;
      const annotations = await page.getAnnotations();
      for (const ann of annotations) {
        if (ann.subtype !== 'Link' || (!ann.url && !ann.dest)) continue;
        const [x1, y1, x2, y2] = cssVP.convertToViewportRectangle(ann.rect);
        const a = document.createElement('a');
        if (ann.url) { a.href = ann.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; }
        a.style.cssText = `position:absolute;left:${Math.min(x1,x2)}px;top:${Math.min(y1,y2)}px;width:${Math.abs(x2-x1)}px;height:${Math.abs(y2-y1)}px;pointer-events:all;cursor:pointer;`;
        annotDiv.appendChild(a);
      }

      wrapper.appendChild(canvas);
      wrapper.appendChild(textDiv);
      wrapper.appendChild(annotDiv);
      container.appendChild(wrapper);
    } catch (e) {
      console.error('render error', e);
    }
    setRendering(false);
  }, []);

  const renderSpread = useCallback(async (doc: any, page: number, total: number, container: HTMLElement) => {
    if (!doc || !container) return;
    const { left, right } = getSpread(page, total);
    const pages = [left, right].filter(Boolean) as number[];
    if (pages.length === 0) return;

    setRendering(true);
    container.innerHTML = '';
    const flex = document.createElement('div');
    flex.style.cssText = 'display:flex;gap:4px;align-items:flex-start;justify-content:center;width:100%;';

    const dpr = window.devicePixelRatio || 1;
    const availW = (container.offsetWidth || 1400) / pages.length - 4;

    for (const pn of pages) {
      const pg = await doc.getPage(pn);
      const naturalVP = pg.getViewport({ scale: 1 });
      const cssScale = availW / naturalVP.width;
      const cssVP = pg.getViewport({ scale: cssScale });
      const renderVP = pg.getViewport({ scale: cssScale * dpr * 1.5 });

      const wrapper = document.createElement('div');
      wrapper.style.cssText = `position:relative;width:${cssVP.width}px;height:${cssVP.height}px;flex-shrink:0;`;

      const canvas = document.createElement('canvas');
      canvas.width = renderVP.width; canvas.height = renderVP.height;
      canvas.style.cssText = `position:absolute;top:0;left:0;width:${cssVP.width}px;height:${cssVP.height}px;display:block;`;
      await pg.render({ canvasContext: canvas.getContext('2d')!, viewport: renderVP }).promise;

      const textDiv = document.createElement('div');
      textDiv.className = 'pdfTextLayer';
      textDiv.style.cssText = `position:absolute;top:0;left:0;width:${cssVP.width}px;height:${cssVP.height}px;overflow:hidden;line-height:1;`;
      const textContent = await pg.getTextContent();
      const { renderTextLayer } = await import('pdfjs-dist');
      await renderTextLayer({ textContentSource: textContent, container: textDiv, viewport: cssVP, textDivs: [] }).promise;

      const annotDiv = document.createElement('div');
      annotDiv.style.cssText = `position:absolute;top:0;left:0;width:${cssVP.width}px;height:${cssVP.height}px;pointer-events:none;`;
      const annotations = await pg.getAnnotations();
      for (const ann of annotations) {
        if (ann.subtype !== 'Link' || (!ann.url && !ann.dest)) continue;
        const [x1, y1, x2, y2] = cssVP.convertToViewportRectangle(ann.rect);
        const a = document.createElement('a');
        if (ann.url) { a.href = ann.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; }
        a.style.cssText = `position:absolute;left:${Math.min(x1,x2)}px;top:${Math.min(y1,y2)}px;width:${Math.abs(x2-x1)}px;height:${Math.abs(y2-y1)}px;pointer-events:all;cursor:pointer;`;
        annotDiv.appendChild(a);
      }

      wrapper.appendChild(canvas);
      wrapper.appendChild(textDiv);
      wrapper.appendChild(annotDiv);
      flex.appendChild(wrapper);
    }

    container.appendChild(flex);
    setRendering(false);
  }, []);

  // ── Re-render when page/mode changes ────────────────────────────────────
  useEffect(() => {
    if (!pdfDoc || !mainRef.current) return;
    if (spreadMode) {
      renderSpread(pdfDoc, currentPage, totalPages, mainRef.current);
    } else {
      renderPage(pdfDoc, currentPage, mainRef.current);
    }
  }, [pdfDoc, currentPage, spreadMode, totalPages, renderPage, renderSpread]);

  // ResizeObserver
  useEffect(() => {
    if (!mainRef.current) return;
    const obs = new ResizeObserver(() => {
      if (!pdfDoc || !mainRef.current) return;
      if (spreadMode) renderSpread(pdfDoc, currentPage, totalPages, mainRef.current);
      else renderPage(pdfDoc, currentPage, mainRef.current);
    });
    obs.observe(mainRef.current);
    return () => obs.disconnect();
  }, [pdfDoc, currentPage, spreadMode, totalPages, renderPage, renderSpread]);

  // ── Navigation ───────────────────────────────────────────────────────────
  const prev = useCallback(() => {
    setCurrentPage(p => {
      if (spreadMode) {
        const { left } = getSpread(p, totalPages);
        const target = left ? left - 2 : p - 1;
        return Math.max(1, target);
      }
      return Math.max(1, p - 1);
    });
  }, [spreadMode, totalPages]);

  const next = useCallback(() => {
    setCurrentPage(p => {
      if (spreadMode) {
        const { right } = getSpread(p, totalPages);
        const target = right ? right + 1 : p + 1;
        return Math.min(totalPages, target);
      }
      return Math.min(totalPages, p + 1);
    });
  }, [spreadMode, totalPages]);

  // ── Keyboard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); prev(); }
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); next(); }
      else if (e.key === 'f' || e.key === 'F') toggleFullscreen();
      else if (e.key === 't' || e.key === 'T') setShowThumbs(v => !v);
      else if (e.key === 'Escape' && isFullscreen) document.exitFullscreen?.();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [prev, next, isFullscreen]);

  // ── Touch swipe ──────────────────────────────────────────────────────────
  const touchStartX = useRef(0);
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    if (dx > 50) next();
    else if (dx < -50) prev();
  };

  // ── Fullscreen ───────────────────────────────────────────────────────────
  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  const toggleFullscreen = () => {
    if (!isFullscreen) containerRef.current?.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Page indicator label ─────────────────────────────────────────────────
  const pageLabel = spreadMode
    ? (() => { const { left, right } = getSpread(currentPage, totalPages); return [left, right].filter(Boolean).join('–'); })()
    : `${currentPage}`;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        .pdfTextLayer span { color: transparent; position: absolute; white-space: pre; cursor: text; transform-origin: 0% 0%; }
        .pdfTextLayer ::selection { background: rgba(0,159,227,0.35); }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 2px; }
      `}</style>

      <div
        ref={containerRef}
        className="flex flex-col bg-[#1a1a1a] text-white select-none"
        style={{ minHeight: '100dvh' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-2 px-3 bg-[#1E3A5F] h-14 shrink-0 shadow-md">
          <Link href="/revistas" className="p-1.5 rounded hover:bg-white/10 transition shrink-0" aria-label="Volver">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </Link>
          <h1 className="flex-1 text-sm font-semibold text-white/90 truncate text-center">{revista.titulo}</h1>
          <span className="text-xs text-white/50 shrink-0 hidden sm:block">
            {totalPages > 0 ? `${pageLabel} / ${totalPages}` : ''}
          </span>
          <button onClick={() => setSpreadMode(v => !v)} className={`p-1.5 rounded transition shrink-0 ${spreadMode ? 'bg-white/20' : 'hover:bg-white/10'}`} title="Modo doble página">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="9" height="16" rx="1"/><rect x="13" y="4" width="9" height="16" rx="1"/></svg>
          </button>
          <button onClick={() => setShowThumbs(v => !v)} className={`p-1.5 rounded transition shrink-0 ${showThumbs ? 'bg-white/20' : 'hover:bg-white/10'}`} title="Miniaturas">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          </button>
          <button onClick={() => setShowInfo(v => !v)} className={`p-1.5 rounded transition shrink-0 ${showInfo ? 'bg-white/20' : 'hover:bg-white/10'}`} title="Información">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </button>
          <button onClick={toggleFullscreen} className="p-1.5 rounded hover:bg-white/10 transition shrink-0 hidden sm:block" title="Pantalla completa">
            {isFullscreen
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
            }
          </button>
        </header>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">

          {/* Thumbnail strip */}
          {showThumbs && (
            <aside className="w-[180px] shrink-0 overflow-y-auto bg-[#111] flex flex-col gap-2 p-2 border-r border-white/10">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pn => {
                const thumb = thumbsRef.current.get(pn);
                const isActive = spreadMode
                  ? (() => { const { left, right } = getSpread(currentPage, totalPages); return pn === left || pn === right; })()
                  : pn === currentPage;
                return (
                  <button
                    key={pn}
                    onClick={() => setCurrentPage(pn)}
                    className={`shrink-0 rounded overflow-hidden border-2 transition-all ${isActive ? 'border-[#1E3A5F] opacity-100' : 'border-transparent opacity-50 hover:opacity-80'}`}
                  >
                    {thumb || pn <= thumbsReady
                      ? <img src={thumb} alt={`Pág ${pn}`} className="w-full block" />
                      : (
                        <div className="w-full aspect-[3/4] bg-white/5 flex items-center justify-center">
                          <span className="text-white/30 text-xs">{pn}</span>
                        </div>
                      )
                    }
                    <div className={`text-center text-[10px] py-0.5 ${isActive ? 'text-white' : 'text-white/40'}`}>{pn}</div>
                  </button>
                );
              })}
            </aside>
          )}

          {/* Main viewer */}
          <div className="flex-1 overflow-auto flex items-start justify-center p-4 relative">
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#1a1a1a]">
                <div className="w-8 h-8 border-2 border-white/20 border-t-[#009fe3] rounded-full animate-spin" />
                <p className="text-white/40 text-sm">Cargando PDF…</p>
              </div>
            )}
            {loadError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <p className="text-white/60">{loadError}</p>
                {revista.pdfURL && (
                  <a href={revista.pdfURL} target="_blank" rel="noopener noreferrer"
                    className="px-4 py-2 bg-[#1E3A5F] rounded text-sm hover:bg-[#2a4f80] transition">
                    Descargar PDF
                  </a>
                )}
              </div>
            )}
            {rendering && !loading && (
              <div className="absolute top-6 right-6 w-5 h-5 border-2 border-white/20 border-t-[#009fe3] rounded-full animate-spin pointer-events-none" />
            )}
            <div ref={mainRef} className="w-full max-w-[800px]" style={spreadMode ? { maxWidth: '1400px' } : {}} />
          </div>

          {/* Info panel */}
          {showInfo && (
            <aside className="w-[240px] shrink-0 overflow-y-auto bg-[#111] border-l border-white/10 p-4 flex flex-col gap-4">
              <div>
                <h2 className="font-bold text-sm text-white leading-snug">{revista.titulo}</h2>
                {revista.autor && <p className="text-white/50 text-xs mt-1">{revista.autor}</p>}
                {revista.fechaPublicacion && <p className="text-white/40 text-xs mt-0.5">{formatDate(revista.fechaPublicacion)}</p>}
              </div>
              {revista.descripcion && (
                <p className="text-white/60 text-xs leading-relaxed">{revista.descripcion}</p>
              )}
              {revista.categorias.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {revista.categorias.map(cat => (
                    <span key={cat} className="text-[9px] font-semibold uppercase tracking-wide bg-white/10 text-white/70 px-1.5 py-0.5 rounded-full">
                      {CATEGORIA_LABELS[cat]}
                    </span>
                  ))}
                </div>
              )}
              {revista.marcas.length > 0 && (
                <div>
                  <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1">Marcas</p>
                  <div className="flex flex-wrap gap-1">
                    {revista.marcas.map(m => (
                      <span key={m} className="text-[10px] bg-white/5 text-white/60 px-2 py-0.5 rounded">{m}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-2 mt-auto">
                {revista.pdfURL && (
                  <a href={revista.pdfURL} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-[#1E3A5F] rounded text-xs font-semibold hover:bg-[#2a4f80] transition">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Descargar PDF
                  </a>
                )}
                <button onClick={handleShare}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-white/10 rounded text-xs font-semibold hover:bg-white/20 transition">
                  {copied
                    ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34a853" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg> Copiado</>
                    : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg> Compartir</>
                  }
                </button>
              </div>
            </aside>
          )}
        </div>

        {/* Bottom controls */}
        <footer className="sticky bottom-0 z-30 flex items-center gap-3 px-4 bg-[#111] h-14 shrink-0 border-t border-white/10">
          <button onClick={prev} disabled={currentPage <= 1} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 transition shrink-0" aria-label="Anterior">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <input
            type="range" min={1} max={totalPages || 1} value={currentPage}
            onChange={e => setCurrentPage(Number(e.target.value))}
            className="flex-1 accent-[#009fe3] h-1 cursor-pointer"
          />
          <span className="text-xs text-white/50 shrink-0 tabular-nums">
            {pageLabel}{totalPages ? ` / ${totalPages}` : ''}
          </span>
          <button onClick={next} disabled={currentPage >= totalPages} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 transition shrink-0" aria-label="Siguiente">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </footer>

        <noscript>
          <div style={{ padding: '2rem', textAlign: 'center', color: '#fff', background: '#1a1a1a' }}>
            <p>Se requiere JavaScript para ver esta revista.</p>
            {revista.pdfURL && <a href={revista.pdfURL} style={{ color: '#009fe3' }}>Descargar PDF</a>}
          </div>
        </noscript>
      </div>
    </>
  );
}
