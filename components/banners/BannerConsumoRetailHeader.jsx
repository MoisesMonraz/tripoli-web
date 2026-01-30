"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import bannerTripoli from "../../public/banners/banner-tripoli-media.png";
import bannerAnalytics from "../../public/banners/banner-analytic-services.png";
import bannerWeb from "../../public/banners/banner-web-services.png";

const SLIDE_DURATION_MS = 7500;

const slides = [
  { id: "tripoli", src: bannerTripoli, alt: "Tripoli Media" },
  { id: "analytics", src: bannerAnalytics, alt: "Tripoli Analytics Services" },
  { id: "web", src: bannerWeb, alt: "Tripoli Web Services" },
];

export default function BannerConsumoRetailHeader() {
  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = () => {
    clearTimer();
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, SLIDE_DURATION_MS);
  };

  useEffect(() => {
    startTimer();
    return clearTimer;
  }, []);

  const goTo = (nextIndex) => {
    setActiveIndex(nextIndex);
    startTimer();
  };

  const activeSlide = slides[activeIndex];
  const aspectRatio =
    activeSlide?.src?.height && activeSlide?.src?.width ? activeSlide.src.height / activeSlide.src.width : 0.40625; // fallback 16/6.4
  const trackStyle = { paddingTop: `${aspectRatio * 100}%` };
  const trackInlineStyle = { ...trackStyle, position: "relative", overflow: "hidden" };

  return (
    <div className="tm-banner-wrapper">
      <div className="tm-banner-inner">
        <div className="tm-banner-track" aria-live="polite" style={trackInlineStyle}>
          {slides.map((slide, idx) => {
            const isActive = idx === activeIndex;
            return (
              <div
                key={slide.id}
                className={`tm-banner-slide ${isActive ? "tm-banner-slide--active" : ""}`}
                role="group"
                aria-roledescription="slide"
                aria-label={`${idx + 1} de ${slides.length}`}
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: isActive ? 1 : 0,
                  pointerEvents: isActive ? "auto" : "none",
                  transition: "opacity 350ms ease",
                }}
              >
                <Link href="/servicios" className="block w-full h-full cursor-pointer">
                  <Image
                    src={slide.src}
                    alt={slide.alt}
                    fill
                    priority={idx === 0}
                    sizes="(max-width: 768px) 100vw, 1100px"
                    className="tm-banner-img"
                  />
                </Link>
              </div>
            );
          })}
        </div>

        <div className="tm-dots" role="tablist" aria-label="Selector de banners">
          {slides.map((slide, idx) => {
            const isActive = idx === activeIndex;
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
        .tm-banner-wrapper {
          width: 100%;
          background: var(--tm-banner-bg, #fff);
          margin-top: 0;
        }
        .tm-banner-inner {
          max-width: 70rem; /* align with nav width target */
          margin: 0 auto;
          padding: 0 16px 10px;
          margin-top: 0;
        }
        .tm-banner-track {
          position: relative;
          width: 100%;
          overflow: hidden;
          border-radius: 0;
          background: var(--tm-banner-card, #fff);
          box-shadow: none;
          margin-top: 0;
        }
        .tm-banner-slide {
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 350ms ease;
          pointer-events: none;
        }
        .tm-banner-slide--active {
          opacity: 1;
          pointer-events: auto;
        }
        .tm-banner-slide :global(.tm-banner-img) {
          object-fit: contain;
          background: var(--tm-banner-card, #fff);
        }
        @media (max-width: 768px) {
          .tm-banner-track {
            border-radius: 0;
          }
          .tm-banner-inner {
            padding: 0 12px 10px;
          }
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
    </div>
  );
}
