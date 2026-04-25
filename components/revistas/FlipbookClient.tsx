'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Revista, PageItem } from '../../types/revistas';

interface Props { revista: Revista; }

export default function FlipbookClient({ revista }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const pfRef = useRef<any>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState(0);

  const sortedPages: PageItem[] = [...revista.paginas].sort((a, b) => a.orden - b.orden);

  const initFlipbook = useCallback(async () => {
    if (!bookRef.current || sortedPages.length === 0) return;
    try {
      const { PageFlip } = await import('page-flip');
      const container = containerRef.current!;
      const maxW = Math.min(Math.floor((container.offsetWidth - 32) / 2), 480);
      const w = Math.max(280, maxW);
      const h = Math.round(w * 1.38);

      if (pfRef.current) { pfRef.current.destroy(); pfRef.current = null; }

      // Build the DOM structure page-flip expects
      bookRef.current.innerHTML = '';
      sortedPages.forEach(p => {
        const img = document.createElement('img');
        img.src = p.imageURL;
        img.alt = p.descripcionAlt || `Página ${p.orden}`;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        bookRef.current!.appendChild(img);
      });

      const pf = new PageFlip(bookRef.current, {
        width: w, height: h,
        showCover: true,
        mobileScrollSupport: false,
        drawShadow: true,
        flippingTime: 600,
        startPage: 0,
      });

      pf.loadFromHTML(bookRef.current.querySelectorAll('img'));
      pf.on('flip', (e: any) => setCurrentPage(e.data));
      pf.on('changeOrientation', () => {});

      setTotalPages(pf.getPageCount());
      setCurrentPage(0);
      pfRef.current = pf;
      setLoading(false);
    } catch (err) {
      console.error('FlipBook init error:', err);
      setLoading(false);
    }
  }, [sortedPages]);

  useEffect(() => {
    // Pre-load images then init
    if (sortedPages.length === 0) { setLoading(false); return; }
    let loaded = 0;
    sortedPages.forEach(p => {
      const img = new window.Image();
      img.onload = img.onerror = () => {
        loaded++;
        setImagesLoaded(loaded);
        if (loaded === sortedPages.length) initFlipbook();
      };
      img.src = p.imageURL;
    });
    return () => { pfRef.current?.destroy(); pfRef.current = null; };
  }, [sortedPages, initFlipbook]);

  // Handle fullscreen change
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const prevPage = () => pfRef.current?.flipPrev();
  const nextPage = () => pfRef.current?.flipNext();
  const jumpToPage = (idx: number) => pfRef.current?.flip(idx);

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

  const loadPct = sortedPages.length > 0 ? Math.round((imagesLoaded / sortedPages.length) * 100) : 0;

  return (
    <div ref={containerRef} className="flex flex-col min-h-screen bg-[#0F172A] text-white select-none">

      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2 bg-[#0F172A]/90 border-b border-white/10 h-12 shrink-0">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-[#009fe3] font-bold text-sm tracking-wide">TRIPOLI</span>
          <span className="text-white/40 text-xs">MEDIA</span>
        </Link>
        <h1 className="text-sm font-semibold text-white/90 truncate mx-4 flex-1 text-center">
          {revista.titulo}
        </h1>
        <div className="flex items-center gap-3 shrink-0">
          {totalPages > 0 && (
            <span className="text-xs text-white/50 hidden sm:block">
              Pág. {currentPage + 1} de {totalPages}
            </span>
          )}
          <Link href="/revistas" className="text-white/60 hover:text-white transition-colors text-sm">
            ✕
          </Link>
        </div>
      </header>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0F172A]">
          <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
            <div className="h-full bg-[#009fe3] rounded-full transition-all" style={{ width: `${loadPct}%` }} />
          </div>
          <p className="text-white/40 text-xs">Cargando páginas... {loadPct}%</p>
        </div>
      )}

      {/* Flipbook area */}
      <div className="flex-1 flex items-center justify-center px-4 py-2 overflow-hidden">
        <div ref={bookRef} className="shadow-2xl" />
      </div>

      {/* Bottom controls */}
      <footer className="flex items-center gap-2 px-4 py-3 bg-[#0F172A]/90 border-t border-white/10 shrink-0">
        {/* Prev */}
        <button onClick={prevPage} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-white shrink-0" aria-label="Página anterior">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>

        {/* Thumbnail strip */}
        <div className="flex-1 overflow-x-auto flex gap-1.5 py-1 scrollbar-hide">
          {sortedPages.map((p, idx) => (
            <button key={idx} onClick={() => jumpToPage(idx)}
              className={`shrink-0 w-8 h-10 rounded overflow-hidden border-2 transition-all ${currentPage === idx ? 'border-[#009fe3]' : 'border-transparent opacity-50 hover:opacity-80'}`}>
              <Image src={p.imageURL} alt={`Pág ${idx + 1}`} width={32} height={40} className="object-cover w-full h-full" unoptimized />
            </button>
          ))}
        </div>

        {/* Next */}
        <button onClick={nextPage} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-white shrink-0" aria-label="Página siguiente">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>

        {/* Fullscreen */}
        <button onClick={toggleFullscreen} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-white shrink-0 hidden sm:block" aria-label="Pantalla completa">
          {isFullscreen
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
          }
        </button>

        {/* Share */}
        <button onClick={handleShare} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-white shrink-0" aria-label="Compartir">
          {copied
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34a853" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          }
        </button>
      </footer>
    </div>
  );
}
