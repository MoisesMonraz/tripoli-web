"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

// Static public paths to ensure predictable sizing and avoid dynamic imports.
export const defaultSlides = [
  { id: "tripoli", src: "/banners/banner-tripoli-media.png", alt: "Tripoli Media" },
  { id: "analytics", src: "/banners/banner-analytic-services.png", alt: "Tripoli Analytics Services" },
  { id: "web", src: "/banners/banner-web-services.png", alt: "Tripoli Web Services" },
];

const DEFAULT_DURATION = 7500;

export default function BaseBanner({ slides = defaultSlides, slideDuration = DEFAULT_DURATION, aspectRatioOverride }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const timerRef = useRef(null);

  const slidesWithExtras = useMemo(() => {
    const hasCustomSlides = Array.isArray(slides) && slides.length > 0;
    if (!hasCustomSlides) return defaultSlides;

    const customSlides = [...slides];
    if (customSlides.length === 1) {
      const ids = new Set(customSlides.map((s) => s.id));
      const analyticsSlide = defaultSlides.find((s) => s.id === "analytics");
      const webSlide = defaultSlides.find((s) => s.id === "web");
      if (analyticsSlide && !ids.has(analyticsSlide.id)) customSlides.push(analyticsSlide);
      if (webSlide && !ids.has(webSlide.id)) customSlides.push(webSlide);
    }
    return customSlides;
  }, [slides]);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = () => {
    clearTimer();
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slidesWithExtras.length);
    }, slideDuration);
  };

  useEffect(() => {
    setMounted(true);
    startTimer();
    return clearTimer;
  }, [slideDuration, slidesWithExtras.length]);

  const goTo = (nextIndex) => {
    setActiveIndex(nextIndex);
    startTimer();
  };

  const safeIndex = slidesWithExtras.length ? activeIndex % slidesWithExtras.length : 0;
  const activeSlide = slidesWithExtras[safeIndex];
  const aspectRatio = aspectRatioOverride
    ? aspectRatioOverride
    : activeSlide?.src?.height && activeSlide?.src?.width
      ? activeSlide.src.height / activeSlide.src.width
      : 0.40625;

  return (
    <section className="w-full m-0 p-0">
      <div className="max-w-[70rem] mx-auto w-full px-4 sm:px-[12px] md:px-4 m-0 p-0">
        <div
          className={`tm-banner-track ${mounted ? "tm-banner-track--mounted" : "tm-banner-track--initial"} relative w-full aspect-[16/4] overflow-hidden m-0 p-0`}
          aria-live="polite"
        >
          {slidesWithExtras.map((slide, idx) => {
            const isActive = idx === safeIndex;
            return (
              <div
                key={slide.id}
                className={`tm-banner-slide ${isActive ? "tm-banner-slide--active" : ""} ${mounted ? "is-mounted" : ""}`}
                role="group"
                aria-roledescription="slide"
                aria-label={`${idx + 1} de ${slidesWithExtras.length}`}
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: isActive ? 1 : 0,
                  pointerEvents: isActive ? "auto" : "none",
                  transition: mounted ? "opacity 350ms ease" : "none",
                  transform: "translateX(0)",
                }}
              >
                <Link href="/servicios" className="block w-full h-full cursor-pointer">
                  <Image
                    src={slide.src}
                    alt={slide.alt}
                    fill
                    priority={idx === 0}
                    fetchPriority={idx === 0 ? "high" : "auto"}
                    sizes="(max-width: 768px) 100vw, 1100px"
                    className="tm-banner-img object-cover object-center"
                  />
                </Link>
              </div>
            );
          })}
        </div>

        <div className="tm-dots" role="tablist" aria-label="Selector de banners">
          {slidesWithExtras.map((slide, idx) => {
            const isActive = idx === safeIndex;
            return (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Ir al banner ${idx + 1}`}
                className={`tm-dot ${isActive ? "tm-dot--active" : ""}`}
                onClick={() => goTo(idx)}
              />
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .tm-banner-track--initial {
          transition: none !important;
        }
        .tm-banner-track--mounted {
          transition: transform 0.6s ease;
        }
        .tm-banner-slide {
          position: absolute;
          inset: 0;
          opacity: 0;
          pointer-events: none;
        }
        .tm-banner-slide--active {
          opacity: 1;
          pointer-events: auto;
        }
        .tm-banner-slide :global(.tm-banner-img) {
          background: var(--tm-banner-card, #fff);
          object-fit: cover;
          object-position: center;
          width: 100%;
          height: 100%;
        }
        .tm-dots {
          display: flex;
          justify-content: center;
          gap: 0;
          margin-top: 12px;
          margin-bottom: 12px;
        }
        .tm-dot {
          width: 16px;
          height: 8px;
          border-radius: 0;
          border: 1px solid #cbd5e1;
          background: #e2e8f0;
          transition: background-color 160ms ease, border-color 160ms ease;
          color: inherit;
        }
        :global(body.dark) .tm-dot {
          border-color: #475569;
          background: #1e293b;
        }
        .tm-dot--active {
          background: #00bfff;
          border-color: #00bfff;
          transform: none;
        }
        .tm-dot:hover,
        .tm-dot:focus-visible {
          background: #33ceff;
          border-color: #33ceff;
          outline: none;
          transform: none;
        }
      `}</style>
    </section>
  );
}
