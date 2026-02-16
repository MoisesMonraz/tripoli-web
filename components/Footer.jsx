"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import logoSrc from "../Imagenes/Logos/Tripoli Media Logo Sin Fondo.png";
import facebookSrc from "../Imagenes/Logos/Facebook.png";
import xSrc from "../Imagenes/Logos/X azul.png";
import xDarkSrc from "../Imagenes/Logos/X azul.png";
import linkedinSrc from "../Imagenes/Logos/LinkedIn.png";
import whatsappSrc from "../Imagenes/Logos/WhatsApp.png";

const MailIcon = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={`tm-social-img h-[32px] w-[32px] object-contain ${className}`}
    aria-hidden="true"
  >
    <defs>
      <mask id="tm-mail-cutout">
        <rect width="24" height="24" fill="white" />
        <path
          d="M2.25 6.75A3 3 0 0 1 5.25 3.75h13.5a3 3 0 0 1 3 3v10.5a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V6.75Zm3.24.47a.75.75 0 1 0-.88 1.26l7.5 5.25a.75.75 0 0 0 .88 0l7.5-5.25a.75.75 0 0 0-.88-1.26L12 12.44 5.49 7.22Z"
          fill="black"
          transform="translate(12 12) scale(0.8154 0.7273) translate(-12 -12)"
        />
      </mask>
    </defs>
    <circle cx="12" cy="12" r="12" fill="black" mask="url(#tm-mail-cutout)" />
  </svg>
);

const socials = [
  { name: "Facebook", href: "https://www.facebook.com/TripoliMediaMX", src: facebookSrc, alt: "Facebook" },
  { name: "LinkedIn", href: "https://www.linkedin.com/tripoli-media/", src: linkedinSrc, alt: "LinkedIn" },
  { name: "X", href: "https://x.com/TripoliMedia", src: xSrc, darkSrc: xDarkSrc, alt: "X" },
  {
    name: "Email",
    href: "https://mail.google.com/mail/?view=cm&fs=1&to=contacto@tripoli.media",
    icon: MailIcon,
    alt: "Email",
  },
  { name: "WhatsApp", href: "https://wa.me/523328175756", src: whatsappSrc, alt: "WhatsApp" },
];

const iconFilters = {
  light: {
    base: "brightness(0) saturate(100%) invert(34%) sepia(98%) saturate(1516%) hue-rotate(169deg) brightness(95%) contrast(101%)",
    hover: "brightness(0) saturate(100%) invert(88%) sepia(21%) saturate(5411%) hue-rotate(170deg) brightness(101%) contrast(93%)",
  },
  dark: {
    base: "brightness(0) saturate(100%) invert(100%)",
    hover: "brightness(0) saturate(100%) invert(53%) sepia(65%) saturate(2560%) hue-rotate(171deg) brightness(100%) contrast(104%)",
  },
};

export default function Footer() {
  const pathname = usePathname();
  const isPrivacyActive = pathname === "/aviso-de-privacidad" || pathname.startsWith("/aviso-de-privacidad/");
  const isTermsActive = pathname === "/terminos-y-condiciones" || pathname.startsWith("/terminos-y-condiciones/");
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      if (typeof document === "undefined") return;
      setIsDarkTheme(document.documentElement.classList.contains("dark"));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <footer
      className="w-full bg-white font-raleway dark:bg-slate-950"
      style={{ fontFamily: "'Roboto', sans-serif" }}
    >
      <div className="h-[4px] w-full tm-footer-line" />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col items-center gap-6 md:grid md:grid-cols-[1fr_auto_1fr] md:gap-x-4 md:gap-y-6">
          {/* 1. Nav Links - order-1 mobile, Col 1 Row 1 desktop */}
          <div className="order-1 md:col-start-1 md:row-start-1 flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3 text-[14px] sm:text-[16px] font-semibold tracking-[0.05em] text-slate-700 dark:text-slate-200 font-raleway">
            <FooterNavLink
              href="/conocenos"
              label="Conócenos"
              isActive={pathname === "/conocenos" || pathname.startsWith("/conocenos/")}
            />
            <span className="text-slate-300">|</span>
            <FooterNavLink
              href="/servicios"
              label="Servicios"
              isActive={pathname === "/servicios" || pathname.startsWith("/servicios/")}
            />
            <span className="text-slate-300">|</span>
            <FooterNavLink
              href="/contacto"
              label="Contacto"
              isActive={pathname === "/contacto" || pathname.startsWith("/contacto/")}
            />
          </div>

          {/* 2. Combined Logo + Social Icons - order-2 mobile */}
          <div className="order-2 w-full flex flex-row items-center justify-center gap-6 md:contents">
            {/* Logo Part */}
            <div className="md:col-start-2 md:row-start-1 flex items-center justify-center">
              <Link href="/" aria-label="Ir a la pagina principal">
                <Image src={logoSrc} alt="Tripoli Media" width={34} height={34} className="h-[30px] w-[30px] sm:h-[34px] sm:w-[34px] object-contain" />
              </Link>
            </div>

            {/* Socials Part */}
            <div className="md:col-start-3 md:row-start-1 flex items-center justify-center md:justify-end gap-2 sm:gap-2.5 text-[#04071A] dark:text-[#33ceff]">

              {/* Social Icons */}
              {socials.map((item) => {
                const iconSrc = isDarkTheme && item.darkSrc ? item.darkSrc : item.src;
                const filterSet = isDarkTheme ? iconFilters.dark : iconFilters.light;
                const Icon = item.icon;
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    aria-label={item.name}
                    className="tm-social-icon flex h-[28px] w-[28px] sm:h-[32px] sm:w-[32px] items-center justify-center transition duration-200 hover:-translate-y-0.5 hover:scale-[1.03] hover:text-[#33ceff] dark:hover:text-[#66deff]"
                    rel="noopener noreferrer"
                    target="_blank"
                    style={{ "--tm-social-filter": filterSet.base, "--tm-social-filter-hover": filterSet.hover }}
                  >
                    <span className="flex h-[28px] w-[28px] sm:h-[32px] sm:w-[32px] items-center justify-center">
                      {Icon ? (
                        <Icon />
                      ) : (
                        <Image
                          src={iconSrc}
                          alt={item.alt}
                          width={32}
                          height={32}
                          className="tm-social-img h-[28px] w-[28px] sm:h-[32px] sm:w-[32px] object-contain"
                          style={{ filter: "var(--tm-social-filter)" }}
                        />
                      )}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>

          {/* 3. Legal Links - order-3 mobile, Col 3 Row 2 desktop */}
          <div className="order-3 md:col-start-3 md:row-start-2 flex w-fit mx-auto md:w-auto md:mx-0 items-center gap-2 justify-center md:justify-end text-xs">
            <Link
              href="/aviso-de-privacidad"
              aria-current={isPrivacyActive ? "page" : undefined}
              className={`no-underline hover:no-underline transition text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-100 ${isPrivacyActive ? "font-semibold" : "font-normal hover:font-semibold"
                }`}
            >
              Aviso de Privacidad
            </Link>
            <span className="text-slate-300">|</span>
            <Link
              href="/terminos-y-condiciones"
              aria-current={isTermsActive ? "page" : undefined}
              className={`no-underline hover:no-underline transition text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-100 ${isTermsActive ? "font-semibold" : "font-normal hover:font-semibold"
                }`}
            >
              T\u00E9rminos y Condiciones
            </Link>
          </div>

          {/* 4. Copyright - order-4 mobile, Col 1 Row 2 desktop */}
          <div className="order-4 md:col-start-1 md:row-start-2 w-fit mx-auto md:w-auto md:mx-0 text-center md:text-left text-xs text-slate-500 dark:text-slate-400">
            {"\u00A9 2026 Tripoli Media. Todos los derechos reservados."}
          </div>
        </div>
      </div>
      <style jsx>{`
        .tm-footer-line {
          position: relative;
          z-index: 5;
          background-image: linear-gradient(
            90deg,
            #c9e8fb,
            #9cd8f6,
            #6cc6f0,
            #36b3e8,
            #009fe3,
            #36b3e8,
            #6cc6f0,
            #9cd8f6,
            #c9e8fb
          );
          background-size: 300% 100%;
          animation: tmFooterFlow 10s linear infinite;
          box-shadow:
            0 -6px 12px rgba(0, 0, 0, 0.09),
            0 -10px 18px rgba(0, 0, 0, 0.07),
            0 -12px 20px rgba(0, 0, 0, 0.06);
          filter: drop-shadow(0 -8px 12px rgba(0, 0, 0, 0.1));
        }
        @keyframes tmFooterFlow {
          0% {
            background-position: 0% 0;
          }
          50% {
            background-position: 100% 0;
          }
          100% {
            background-position: 0% 0;
          }
        }
        .tm-social-img {
          filter: var(--tm-social-filter);
          transition: filter 0.2s ease, transform 0.2s ease !important;
        }
        :global(.tm-social-icon:hover .tm-social-img) {
          filter: var(--tm-social-filter-hover) !important;
        }
      `}</style>
    </footer>
  );
}

function FooterNavLink({ href, label, isActive }) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`group relative inline-flex pb-1 transition hover:opacity-75 ${isActive
        ? "text-slate-800 hover:text-[#00BFFF] dark:text-slate-200 dark:hover:text-[#33ceff]"
        : "text-slate-700 hover:text-[#00BFFF] dark:text-slate-200 dark:hover:text-[#33ceff]"
        }`}
    >
      <span>{label}</span>
      <span
        className={`absolute left-0 right-0 -bottom-0.5 h-[1.5px] origin-left bg-gradient-to-r from-[#00BFFF] to-[#33ceff] transition duration-200 ease-out ${isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
          }`}
      />
    </Link>
  );
}


