"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import * as pdfjsLib from "pdfjs-dist";
import { renderTextLayer, AnnotationLayer } from "pdfjs-dist";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

class SimpleLinkService {
  externalLinkTarget = 2;
  externalLinkRel = "noopener noreferrer nofollow";
  private _externalLinkEnabled = true;
  get pagesCount() { return 0; }
  get page() { return 1; }
  set page(_: number) {}
  get rotation() { return 0; }
  set rotation(_: number) {}
  get isInPresentationMode() { return false; }
  get externalLinkEnabled() { return this._externalLinkEnabled; }
  set externalLinkEnabled(v: boolean) { this._externalLinkEnabled = v; }
  addLinkAttributes(link: HTMLAnchorElement, url: string) {
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer nofollow";
  }
  async goToDestination(): Promise<void> {}
  goToPage(): void {}
  getDestinationHash(): string { return ""; }
  getAnchorUrl(hash: string): string { return hash; }
  setHash(): void {}
  executeNamedAction(): void {}
  executeSetOCGState(): void {}
  cachePageRef(): void {}
  isPageVisible(): boolean { return true; }
  isPageCached(): boolean { return false; }
}

const l10nMock = {
  get: (_key: string, _args?: unknown, fallback?: string) => Promise.resolve(fallback ?? ""),
  getLanguage: () => Promise.resolve("es"),
  getDirection: () => Promise.resolve("ltr"),
  translate: (_el: HTMLElement) => Promise.resolve(),
};

function snapToLeftPage(pg: number): number {
  if (pg <= 1) return 1;
  return pg % 2 === 0 ? pg : pg - 1;
}

interface Props {
  pdfUrl: string;
  titulo: string;
}

export default function FlipbookViewer({ pdfUrl, titulo }: Props) {
  const [numPages, setNumPages] = useState(0);
  const [leftPage, setLeftPage] = useState(1);
  const [isSpread, setIsSpread] = useState(true);
  const [thumbsOpen, setThumbsOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const viewerContentRef = useRef<HTMLDivElement>(null);
  const thumbsContainerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<PDFDocumentProxy | null>(null);
  const renderTokenRef = useRef(0);
  const touchStartXRef = useRef<number | null>(null);
  const stateRef = useRef({ numPages: 0, leftPage: 1, isSpread: true });

  useEffect(() => {
    stateRef.current = { numPages, leftPage, isSpread };
  });

  // Load PDF
  useEffect(() => {
    let cancelled = false;
    setPdfLoaded(false);
    setLoadError(null);
    setNumPages(0);
    setLeftPage(1);

    async function load() {
      try {
        const task = pdfjsLib.getDocument({ url: pdfUrl });
        const doc = await task.promise;
        if (cancelled) { doc.destroy(); return; }
        pdfDocRef.current = doc;
        setNumPages(doc.numPages);
        setPdfLoaded(true);
      } catch {
        if (!cancelled) setLoadError("No se pudo cargar el PDF.");
      }
    }
    load();
    return () => { cancelled = true; };
  }, [pdfUrl]);

  // Render pages
  useEffect(() => {
    if (!pdfLoaded || !viewerContentRef.current) return;
    const token = ++renderTokenRef.current;

    async function renderPages() {
      const container = viewerContentRef.current!;
      container.innerHTML = "";
      const doc = pdfDocRef.current!;
      const { isSpread, leftPage, numPages } = stateRef.current;

      const pagesToRender: number[] = [];
      if (leftPage >= 1 && leftPage <= numPages) pagesToRender.push(leftPage);
      if (isSpread && leftPage > 1 && leftPage + 1 <= numPages) pagesToRender.push(leftPage + 1);

      const row = document.createElement("div");
      row.style.cssText =
        "display:flex;gap:3px;align-items:flex-start;justify-content:center;padding:16px;min-height:100%;";
      container.appendChild(row);

      for (const pageNum of pagesToRender) {
        if (renderTokenRef.current !== token) return;
        await renderOnePage(doc, pageNum, row, token, container);
      }
    }

    renderPages().catch(() => {});
  }, [pdfLoaded, leftPage, isSpread]);

  async function renderOnePage(
    doc: PDFDocumentProxy,
    pageNum: number,
    row: HTMLElement,
    token: number,
    containerEl: HTMLElement,
  ) {
    const page: PDFPageProxy = await doc.getPage(pageNum);
    if (renderTokenRef.current !== token) return;

    const naturalVp = page.getViewport({ scale: 1 });
    const { isSpread, leftPage } = stateRef.current;
    const spreadCount = isSpread && leftPage > 1 ? 2 : 1;
    const containerW = containerEl.clientWidth || window.innerWidth;
    const containerH = containerEl.clientHeight || window.innerHeight - 104;
    const availW = Math.max(100, (containerW - 40 - (spreadCount - 1) * 3) / spreadCount);
    const availH = Math.max(100, containerH - 32);
    const displayScale = Math.min(availW / naturalVp.width, availH / naturalVp.height, 2.5);

    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const renderScale = displayScale * DPR;
    const renderVp = page.getViewport({ scale: renderScale });
    const displayVp = page.getViewport({ scale: displayScale });

    const pageWrapper = document.createElement("div");
    pageWrapper.style.cssText = `position:relative;width:${displayVp.width}px;height:${displayVp.height}px;overflow:hidden;background:#fff;box-shadow:0 4px 24px rgba(0,0,0,0.5);flex-shrink:0;`;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(renderVp.width);
    canvas.height = Math.round(renderVp.height);
    canvas.style.cssText = `position:absolute;top:0;left:0;width:${displayVp.width}px;height:${displayVp.height}px;`;
    pageWrapper.appendChild(canvas);

    const textDiv = document.createElement("div");
    textDiv.className = "pdfTextLayer";
    textDiv.style.cssText = `position:absolute;top:0;left:0;width:${displayVp.width}px;height:${displayVp.height}px;overflow:hidden;pointer-events:auto;line-height:1;`;
    pageWrapper.appendChild(textDiv);

    const annotDiv = document.createElement("div");
    annotDiv.className = "pdfAnnotLayer";
    annotDiv.style.cssText = `position:absolute;top:0;left:0;width:${displayVp.width}px;height:${displayVp.height}px;pointer-events:auto;`;
    pageWrapper.appendChild(annotDiv);

    row.appendChild(pageWrapper);

    // Canvas render
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport: renderVp }).promise;
    if (renderTokenRef.current !== token) return;

    // Text layer
    try {
      const task = renderTextLayer({
        textContentSource: page.streamTextContent(),
        container: textDiv,
        viewport: displayVp,
      });
      await task.promise;
    } catch { /* non-critical */ }

    if (renderTokenRef.current !== token) return;

    // Annotation layer (links)
    try {
      const annotations = await page.getAnnotations();
      if (renderTokenRef.current !== token) return;
      const annLayer = new AnnotationLayer({
        div: annotDiv as HTMLDivElement,
        accessibilityManager: null,
        annotationCanvasMap: null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        l10n: l10nMock as any,
        page,
        viewport: displayVp,
      });
      await annLayer.render({
        viewport: displayVp,
        div: annotDiv as HTMLDivElement,
        annotations,
        page,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        linkService: new SimpleLinkService() as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        downloadManager: null as any,
        renderForms: false,
        enableScripting: false,
        hasJSActions: false,
        fieldObjects: null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        annotationCanvasMap: null as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        accessibilityManager: null as any,
        imageResourcesPath: "",
      });
    } catch { /* non-critical */ }
  }

  // Thumbnails
  useEffect(() => {
    if (!pdfLoaded || !thumbsContainerRef.current) return;
    const doc = pdfDocRef.current!;
    const container = thumbsContainerRef.current;
    container.innerHTML = "";
    let cancelled = false;

    async function renderThumbs() {
      for (let i = 1; i <= doc.numPages && !cancelled; i++) {
        const page = await doc.getPage(i);
        const vp = page.getViewport({ scale: 0.15 });
        const btn = document.createElement("button");
        btn.setAttribute("data-page", String(i));
        btn.style.cssText =
          "display:flex;flex-direction:column;align-items:center;gap:2px;width:100%;cursor:pointer;border:none;background:transparent;padding:4px 6px;opacity:0.55;transition:opacity 0.15s;";
        const cv = document.createElement("canvas");
        cv.width = Math.round(vp.width);
        cv.height = Math.round(vp.height);
        cv.style.cssText = "width:100%;height:auto;border:1px solid rgba(255,255,255,0.12);display:block;";
        const lbl = document.createElement("span");
        lbl.style.cssText = "color:rgba(255,255,255,0.45);font-size:9px;font-family:sans-serif;";
        lbl.textContent = String(i);
        btn.appendChild(cv);
        btn.appendChild(lbl);
        container.appendChild(btn);
        btn.onclick = () => {
          const { isSpread } = stateRef.current;
          setLeftPage(isSpread ? snapToLeftPage(i) : i);
        };
        const ctx2 = cv.getContext("2d")!;
        await page.render({ canvasContext: ctx2, viewport: vp }).promise;
      }
    }
    renderThumbs().catch(() => {});
    return () => { cancelled = true; };
  }, [pdfLoaded]);

  // Highlight active thumbnail
  useEffect(() => {
    if (!thumbsContainerRef.current) return;
    const btns = thumbsContainerRef.current.querySelectorAll<HTMLElement>("button[data-page]");
    btns.forEach((btn) => {
      const pg = parseInt(btn.dataset.page ?? "0");
      const active = pg === leftPage || (isSpread && pg === leftPage + 1 && leftPage > 1);
      btn.style.opacity = active ? "1" : "0.55";
      const cv = btn.querySelector("canvas");
      if (cv) (cv as HTMLElement).style.border = active ? "1px solid #00BFFF" : "1px solid rgba(255,255,255,0.12)";
    });
  }, [leftPage, isSpread]);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (!thumbsContainerRef.current) return;
    const btn = thumbsContainerRef.current.querySelector<HTMLElement>(`button[data-page="${leftPage}"]`);
    btn?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [leftPage]);

  // Navigation
  const navigate = useCallback((dir: 1 | -1) => {
    setLeftPage((prev) => {
      const { numPages, isSpread } = stateRef.current;
      if (numPages === 0) return prev;
      if (!isSpread) return Math.max(1, Math.min(numPages, prev + dir));
      const last = numPages <= 1 ? 1 : numPages % 2 === 0 ? numPages : numPages - 1;
      if (dir === 1) {
        if (prev === 1) return Math.min(2, numPages);
        return Math.min(prev + 2, last);
      }
      if (prev <= 2) return 1;
      return prev - 2;
    });
  }, []);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowLeft") navigate(-1);
      else if (e.key === "ArrowRight") navigate(1);
      else if (e.key === "f" || e.key === "F") {
        if (!document.fullscreenElement) rootRef.current?.requestFullscreen?.().catch(() => {});
        else document.exitFullscreen?.().catch(() => {});
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);

  // Fullscreen change
  useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) rootRef.current?.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.().catch(() => {});
  };

  const toggleSpread = () => {
    setIsSpread((s) => {
      if (!s) setLeftPage((p) => snapToLeftPage(p));
      return !s;
    });
  };

  // Touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartXRef.current;
    if (Math.abs(dx) > 48) navigate(dx < 0 ? 1 : -1);
    touchStartXRef.current = null;
  };

  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pg = parseInt(e.target.value);
    setLeftPage(isSpread ? snapToLeftPage(pg) : Math.max(1, Math.min(numPages, pg)));
  };

  const isAtStart = leftPage <= 1;
  const isAtEnd = numPages > 0 && (() => {
    if (!isSpread) return leftPage >= numPages;
    const last = numPages <= 1 ? 1 : numPages % 2 === 0 ? numPages : numPages - 1;
    return leftPage >= last;
  })();

  const pageLabel = (() => {
    if (!pdfLoaded) return "…";
    if (!isSpread) return `${leftPage} / ${numPages}`;
    if (leftPage === 1) return `1 / ${numPages}`;
    const right = Math.min(leftPage + 1, numPages);
    return `${leftPage}–${right} / ${numPages}`;
  })();

  return (
    <div
      ref={rootRef}
      className="flex flex-col bg-[#152030] select-none"
      style={{ height: "100dvh", minHeight: "100svh" }}
    >
      {/* Top bar */}
      <div className="flex items-center h-14 px-3 gap-2 bg-[#1E3A5F] text-white flex-shrink-0 z-10 shadow-md">
        <Link
          href="/revistas"
          className="flex items-center justify-center h-9 w-9 rounded-lg hover:bg-white/10 transition flex-shrink-0"
          aria-label="Volver a revistas"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        <button
          onClick={() => setThumbsOpen((o) => !o)}
          className="hidden md:flex items-center justify-center h-9 w-9 rounded-lg hover:bg-white/10 transition flex-shrink-0"
          aria-label="Miniaturas"
          title="Miniaturas (panel lateral)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        </button>

        <h1 className="flex-1 truncate text-sm font-semibold text-white/90 min-w-0 px-1">{titulo}</h1>

        <span className="hidden sm:block text-xs text-white/55 whitespace-nowrap flex-shrink-0 tabular-nums">
          {pageLabel}
        </span>

        <button
          onClick={toggleSpread}
          className="hidden md:flex items-center justify-center h-9 w-9 rounded-lg hover:bg-white/10 transition flex-shrink-0"
          aria-label={isSpread ? "Vista de una página" : "Vista doble"}
          title={isSpread ? "Vista de una página" : "Vista de dos páginas"}
        >
          {isSpread ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <rect x="3" y="4" width="8" height="16" rx="1" />
              <rect x="13" y="4" width="8" height="16" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <rect x="4" y="4" width="16" height="16" rx="1" />
            </svg>
          )}
        </button>

        <button
          onClick={toggleFullscreen}
          className="flex items-center justify-center h-9 w-9 rounded-lg hover:bg-white/10 transition flex-shrink-0"
          aria-label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          title={isFullscreen ? "Salir de pantalla completa (F)" : "Pantalla completa (F)"}
        >
          {isFullscreen ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9H4m5 0V4M15 9h5m-5 0V4M9 15H4m5 0v5M15 15h5m-5 0v5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" />
            </svg>
          )}
        </button>
      </div>

      {/* Middle: thumbnails + viewer */}
      <div className="flex flex-1 overflow-hidden">
        {/* Thumbnail panel */}
        {thumbsOpen && (
          <div
            ref={thumbsContainerRef}
            className="hidden md:flex flex-col w-[136px] flex-shrink-0 overflow-y-auto bg-[#0e1b2d] py-2 px-1 gap-0"
          />
        )}

        {/* Viewer */}
        <div
          className="flex-1 overflow-auto relative"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Imperative canvas target */}
          <div ref={viewerContentRef} className="min-h-full" />

          {/* Loading overlay */}
          {!pdfLoaded && !loadError && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#152030]">
              <div className="flex flex-col items-center gap-3 text-white/60">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[#00BFFF]" />
                <span className="text-sm">Cargando revista…</span>
              </div>
            </div>
          )}

          {/* Error overlay */}
          {loadError && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#152030]">
              <p className="text-red-400 text-sm px-4 text-center">{loadError}</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="flex items-center gap-3 h-12 px-4 bg-[#1E3A5F] flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          disabled={isAtStart}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 text-white text-lg hover:border-[#00BFFF] hover:text-[#00BFFF] transition disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
          aria-label="Página anterior"
        >
          ‹
        </button>

        <input
          type="range"
          min={1}
          max={numPages || 1}
          value={leftPage}
          onChange={handleSlider}
          className="flex-1 h-1.5 cursor-pointer accent-[#00BFFF]"
          aria-label="Navegar páginas"
        />

        <span className="text-xs text-white/55 whitespace-nowrap tabular-nums flex-shrink-0">{pageLabel}</span>

        <button
          onClick={() => navigate(1)}
          disabled={isAtEnd}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 text-white text-lg hover:border-[#00BFFF] hover:text-[#00BFFF] transition disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
          aria-label="Página siguiente"
        >
          ›
        </button>
      </div>

      <style>{`
        .pdfTextLayer span,
        .pdfTextLayer br {
          color: transparent;
          position: absolute;
          white-space: pre;
          cursor: text;
          transform-origin: 0% 0%;
          user-select: text;
          -webkit-user-select: text;
        }
        .pdfTextLayer ::selection {
          background: rgba(0, 191, 255, 0.25);
          color: transparent;
        }
        .pdfAnnotLayer section {
          position: absolute;
          pointer-events: auto;
        }
        .pdfAnnotLayer .linkAnnotation > a,
        .pdfAnnotLayer .linkAnnotation > a:visited {
          position: absolute;
          display: block;
          cursor: pointer;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
        }
        .pdfAnnotLayer .linkAnnotation > a:hover {
          background: rgba(0, 191, 255, 0.08);
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}
