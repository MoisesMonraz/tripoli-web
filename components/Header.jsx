"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import logoSrc from "../Imagenes/Logos/Tripoli Media Logo Sin Fondo.png";

const navItems = [
  { key: "home", href: "/", path: "/", label: "Inicio" },
  {
    key: "consumo",
    href: "/categoria/consumo-y-retail",
    path: "/categoria/consumo-y-retail",
    categorySlug: "consumo-y-retail",
    label: "Consumo y Retail",
    subcategories: [
      { slug: "fabricantes-y-proveedores", label: "Fabricantes y Proveedores" },
      { slug: "cadenas-comerciales", label: "Cadenas Comerciales" },
      { slug: "tiendas-de-conveniencia", label: "Tiendas de Conveniencia" },
    ],
  },
  {
    key: "entretenimiento",
    href: "/categoria/entretenimiento-y-cultura",
    path: "/categoria/entretenimiento-y-cultura",
    categorySlug: "entretenimiento-y-cultura",
    label: "Entretenimiento y Cultura",
    subcategories: [
      { slug: "productoras-de-contenido", label: "Productoras de Contenido" },
      { slug: "recintos-culturales", label: "Recintos Culturales" },
      { slug: "festivales-eventos-y-artistas", label: "Festivales, Eventos y Artistas" },
    ],
  },
  {
    key: "industria-ti",
    href: "/categoria/industria-ti",
    path: "/categoria/industria-ti",
    categorySlug: "industria-ti",
    label: "Industria TI",
    subcategories: [
      { slug: "fabricantes-de-tecnologia", label: "Fabricantes de Tecnología" },
      { slug: "mayoristas-ti", label: "Mayoristas TI" },
      { slug: "canales-de-distribucion", label: "Canales de Distribuci\u00f3n" },
    ],
  },
  {
    key: "infraestructura",
    href: "/categoria/infraestructura-social",
    path: "/categoria/infraestructura-social",
    categorySlug: "infraestructura-social",
    label: "Infraestructura Social",
    subcategories: [
      { slug: "proveedores-de-materiales", label: "Proveedores de Materiales" },
      { slug: "desarrolladores-de-proyectos", label: "Desarrolladores de Proyectos" },
      { slug: "promotores-inmobiliarios", label: "Promotores Inmobiliarios" },
    ],
  },
  {
    key: "politica",
    href: "/categoria/politica-y-leyes",
    path: "/categoria/politica-y-leyes",
    categorySlug: "politica-y-leyes",
    label: "Pol\u00edtica y Leyes",
    subcategories: [
      { slug: "organismos-publicos", label: "Organismos P\u00fablicos" },
      { slug: "administracion-publica", label: "Administraci\u00f3n P\u00fablica" },
      { slug: "servicios-juridicos", label: "Servicios Jur\u00eddicos" },
    ],
  },
  {
    key: "salud",
    href: "/categoria/sector-salud",
    path: "/categoria/sector-salud",
    categorySlug: "sector-salud",
    label: "Sector Salud",
    subcategories: [
      { slug: "fabricantes-equipos-insumos", label: "Fabricantes de Equipo e Insumos" },
      { slug: "instituciones-de-salud", label: "Instituciones de Salud" },
      { slug: "especialistas-medicos", label: "Especialistas M\u00e9dicos" },
    ],
  },
];

export default function Header() {
  const [isDark, setIsDark] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isStickyVisible, setIsStickyVisible] = useState(false);
  const [dateDisplay, setDateDisplay] = useState("");
  const [timeDisplay, setTimeDisplay] = useState("");
  const timeOffsetRef = useRef(0);
  const pathname = usePathname();

  useEffect(() => {
    if (typeof document === "undefined") return;
    const storedTheme = localStorage.getItem("theme");
    const initialDark = storedTheme ? storedTheme === "dark" : false;
    setIsDark(initialDark);
    document.documentElement.classList.toggle("dark", initialDark);
    document.documentElement.classList.toggle("light", !initialDark);
    if (!storedTheme) {
      localStorage.setItem("theme", "light");
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.classList.toggle("light", !isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsStickyVisible(window.scrollY > 80);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let active = true;

    const computeDisplays = (baseDate) => {
      const locale = "es-MX";
      const month = baseDate.toLocaleString(locale, { month: "2-digit" });
      const day = baseDate.toLocaleString(locale, { day: "2-digit" });
      const year = baseDate.toLocaleString(locale, { year: "numeric" });
      const formattedDate = `${day}/${month}/${year}`;
      const formattedTime = baseDate.toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        hourCycle: "h23",
      });
      setDateDisplay(formattedDate);
      setTimeDisplay(`${formattedTime} hrs`);
    };

    const tickWithOffset = () => {
      const adjustedNow = new Date(Date.now() + timeOffsetRef.current);
      computeDisplays(adjustedNow);
    };

    const syncNetworkTime = async () => {
      try {
        const response = await fetch("https://worldtimeapi.org/api/ip");
        if (!response.ok) throw new Error("Network time fetch failed");
        const data = await response.json();
        const remoteDate = new Date(data.datetime);
        timeOffsetRef.current = remoteDate.getTime() - Date.now();
        if (active) computeDisplays(remoteDate);
      } catch (error) {
        if (active) tickWithOffset();
      }
    };

    tickWithOffset(); // initial paint
    const tickInterval = setInterval(tickWithOffset, 60 * 1000);
    syncNetworkTime();
    const syncInterval = setInterval(syncNetworkTime, 5 * 60 * 1000);

    return () => {
      active = false;
      clearInterval(tickInterval);
      clearInterval(syncInterval);
    };
  }, []);

  const navLinkStyles =
    "relative px-1.5 py-2 text-[0.779rem] md:text-[0.876rem] font-semibold uppercase tracking-[0.05em] text-slate-700 whitespace-nowrap leading-tight transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00BFFF] dark:text-slate-200 dark:focus-visible:outline-[#33ceff]";

  const renderNav = () => (
    <nav className="flex flex-1 items-center justify-center">
      {navItems.map((item, idx) => {
        const hoverTextClass =
          item.key === "consumo"
            ? "hover:text-[#f39200] dark:hover:text-[#f39200]"
            : item.key === "entretenimiento"
              ? "hover:text-[#009640] dark:hover:text-[#009640]"
              : item.key === "industria-ti"
                ? "hover:text-[#0069b4] dark:hover:text-[#0069b4]"
                : item.key === "infraestructura"
                  ? "hover:text-[#5d514c] dark:hover:text-[#5d514c]"
                  : item.key === "politica"
                    ? "hover:text-[#2e2c7e] dark:hover:text-[#2e2c7e]"
                    : item.key === "salud"
                      ? "hover:text-[#e6007e] dark:hover:text-[#e6007e]"
                      : "hover:text-[#00BFFF] dark:hover:text-[#33ceff]";
        const groupHoverTextClass =
          item.key === "consumo"
            ? "group-hover:text-[#f39200] dark:group-hover:text-[#f39200]"
            : item.key === "entretenimiento"
              ? "group-hover:text-[#009640] dark:group-hover:text-[#009640]"
              : item.key === "industria-ti"
                ? "group-hover:text-[#0069b4] dark:group-hover:text-[#0069b4]"
                : item.key === "infraestructura"
                  ? "group-hover:text-[#5d514c] dark:group-hover:text-[#5d514c]"
                  : item.key === "politica"
                    ? "group-hover:text-[#2e2c7e] dark:group-hover:text-[#2e2c7e]"
                    : item.key === "salud"
                      ? "group-hover:text-[#e6007e] dark:group-hover:text-[#e6007e]"
                      : "group-hover:text-[#00BFFF] dark:group-hover:text-[#33ceff]";
        const activeTextClass =
          item.key === "consumo"
            ? "text-[#f39200] dark:text-[#f39200]"
            : item.key === "entretenimiento"
              ? "text-[#009640] dark:text-[#009640]"
              : item.key === "industria-ti"
                ? "text-[#0069b4] dark:text-[#0069b4]"
                : item.key === "infraestructura"
                  ? "text-[#5d514c] dark:text-[#5d514c]"
                  : item.key === "politica"
                    ? "text-[#2e2c7e] dark:text-[#2e2c7e]"
                    : item.key === "salud"
                      ? "text-[#e6007e] dark:text-[#e6007e]"
                      : "text-[#00BFFF] dark:text-[#33ceff]";
        const underlineClass =
          item.key === "consumo"
            ? "bg-[#f39200]"
            : item.key === "entretenimiento"
              ? "bg-[#009640]"
              : item.key === "industria-ti"
                ? "bg-[#0069b4]"
                : item.key === "infraestructura"
                  ? "bg-[#5d514c]"
                  : item.key === "politica"
                    ? "bg-[#2e2c7e]"
                    : item.key === "salud"
                      ? "bg-[#e6007e]"
                      : "bg-gradient-to-r from-[#00BFFF] to-[#33ceff]";
        const hasDropdown = Array.isArray(item.subcategories) && item.subcategories.length > 0;
        const matchPath = item.path ?? item.href ?? "";
        const isActive =
          item.key === "home"
            ? pathname === "/"
            : pathname === matchPath || pathname.startsWith(`${matchPath}/`);

        return (
          <span key={item.key} className="flex items-center">
            {idx > 0 && <span className="mx-1.5 h-5 w-px bg-slate-300/80 dark:bg-slate-600/80" aria-hidden="true" />}
            <div className="relative group flex items-center">
              <Link
                href={item.href}
                className={`${navLinkStyles} ${hoverTextClass} ${groupHoverTextClass} ${isActive ? activeTextClass : ""}`}
                aria-label={item.label}
              >
                <span>{item.label}</span>
                <span
                  className={`absolute left-2.5 right-2.5 bottom-[6px] h-[1.5px] origin-left transition duration-200 ease-out ${isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    } ${underlineClass}`}
                />
              </Link>

              {hasDropdown && (
                <div className="absolute top-full left-0 z-[60] hidden w-max translate-y-2 rounded-md border border-slate-200 bg-white py-2 opacity-0 shadow-lg transition-all duration-200 ease-out pointer-events-none group-hover:translate-y-0 group-hover:opacity-100 group-hover:pointer-events-auto dark:border-slate-700 dark:bg-slate-800 md:block space-y-1">
                  {item.subcategories.map((sub) => (
                    <Link
                      key={sub.slug}
                      href={`/categoria/${item.categorySlug}/${sub.slug}`}
                      className="block px-4 py-1.5 text-sm text-slate-700 whitespace-nowrap transition-colors hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-700"
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </span>
        );
      })}
    </nav>
  );

  const renderRightControls = () => (
    <>
      <button
        type="button"
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        aria-pressed={isDark}
        onClick={() => setIsDark((prev) => !prev)}
        className="group flex h-9 w-9 sm:h-10 sm:w-auto items-center justify-center gap-1 rounded-full border border-slate-200 bg-white/80 px-0 sm:pl-3 sm:pr-2 text-[0.65rem] sm:text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-[#00BFFF] hover:text-[#00BFFF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00BFFF] active:scale-[0.99] dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:border-[#33ceff] dark:hover:text-[#33ceff] dark:focus-visible:outline-[#33ceff]"
      >
        {/* Icono solo para móvil */}
        <span className="flex sm:hidden w-full items-center justify-center" aria-hidden="true">
          {isDark ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14.5 2.5A9 9 0 1 0 21.5 15 A7 7 0 0 1 14.5 2.5Z" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </svg>
          )}
        </span>
        {/* Switch para desktop */}
        <span className="hidden sm:flex relative h-6 w-11 items-center rounded-full bg-slate-100 transition dark:bg-slate-800">
          <span
            className={`absolute left-1 h-4 w-4 rounded-full bg-gradient-to-br from-[#00BFFF] to-[#33ceff] shadow-md shadow-sky-400/40 transition ${isDark ? "translate-x-5 bg-gradient-to-br from-[#33ceff] to-[#66deff]" : ""
              }`}
          />
        </span>
        <span className="hidden sm:inline-flex w-6 items-center justify-center" aria-hidden="true">
          {isDark ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14.5 2.5A9 9 0 1 0 21.5 15 A7 7 0 0 1 14.5 2.5Z" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </svg>
          )}
        </span>
      </button>

    </>
  );

  return (
    <>
      <header data-header="main" className="font-raleway border-b border-slate-200/70 bg-white/85 backdrop-blur-xl transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950/85 relative z-50">
        <div className="mx-auto flex w-full max-w-[70rem] items-center px-3 sm:px-4 py-4 sm:py-6">
          <div className="flex flex-1 items-center gap-1.5 sm:gap-3 min-w-0">
            <button
              type="button"
              aria-expanded={isMenuOpen}
              aria-label={isMenuOpen ? "Cerrar menu" : "Abrir menu"}
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="md:hidden flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-[#00BFFF] hover:text-[#00BFFF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00BFFF] active:scale-[0.98] dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:border-[#33ceff] dark:hover:text-[#33ceff] dark:focus-visible:outline-[#33ceff]"
            >
              {isMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                  <path d="M6 6l12 12M6 18L18 6" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              )}
            </button>

            <div className="group flex h-9 w-9 sm:h-10 sm:w-auto items-center justify-center rounded-full border border-slate-200 bg-white/80 px-0 sm:px-4 text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-[#00BFFF] dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:border-[#33ceff]">
              <Link
                href="/calendario"
                className="flex items-center gap-1.5 sm:gap-2 text-[0.65rem] sm:text-[0.74rem] md:text-[0.82rem] font-semibold tracking-[0.08em] transition group-hover:text-[#00BFFF] dark:group-hover:text-[#33ceff]"
                style={{ fontFamily: "'Space Grotesk', 'Sora', system-ui, sans-serif" }}
                aria-label="Ir al calendario editorial"
              >
                {/* Icono de calendario solo para móvil */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="flex sm:hidden h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {/* Texto completo para desktop */}
                <span className="hidden sm:inline whitespace-nowrap">{dateDisplay}</span>
                <span className="hidden sm:inline h-4 w-px bg-slate-300/80 dark:bg-slate-700/80" aria-hidden="true" />
                <span className="hidden sm:inline whitespace-nowrap">{timeDisplay}</span>
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-center shrink-0 px-2 sm:px-4">
            <Link href="/" className="group flex items-center gap-2 sm:gap-5 text-[#00BFFF] transition hover:opacity-95 dark:text-[#33ceff]" aria-label="Ir a la pagina principal">
              <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center">
                <Image src={logoSrc} alt="Tripoli Media" width={32} height={32} className="h-7 w-7 sm:h-8 sm:w-8 object-contain" priority />
              </span>
              <span className="text-[0.75rem] sm:text-base font-semibold tracking-[0.08em] sm:tracking-[0.12em] uppercase text-[#00BFFF] transition-colors duration-300 group-hover:text-[#33ceff] dark:text-[#33ceff] dark:group-hover:text-[#66deff]">
                Tripoli Media
              </span>
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-end gap-1.5 sm:gap-2.5 md:gap-3 min-w-0">
            {renderRightControls()}
          </div>
        </div>

        <div className="hidden w-full items-center justify-center pb-3 mx-auto md:flex max-w-[70rem]">
          {renderNav()}
        </div>

        {isMenuOpen && (
          <nav className="md:hidden absolute left-0 right-0 top-full mt-[5px] px-3 pb-3 z-50">
            <ul className="w-fit max-w-[70%] space-y-1 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-lg shadow-slate-900/5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-black/30">
              {navItems.map((item) => {
                const matchPath = item.path ?? item.href ?? "";
                const isActive =
                  item.key === "home"
                    ? pathname === "/"
                    : pathname === matchPath || pathname.startsWith(`${matchPath}/`);
                return (
                  <li key={item.key}>
                    <a
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center justify-between rounded-xl px-2 py-1.5 text-[0.5rem] sm:text-sm font-semibold uppercase tracking-[0.08em] sm:tracking-[0.12em] transition hover:bg-slate-100 hover:text-[#00BFFF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00BFFF] dark:hover:bg-slate-800 dark:hover:text-[#33ceff] dark:focus-visible:outline-[#33ceff] ${isActive ? "font-bold text-slate-900 dark:text-slate-50" : "text-slate-700 dark:text-slate-100"}`}
                    >
                      <span className="truncate">- {item.label}</span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </nav>
        )}
      </header>

      <div data-header-line="main" className="h-[4px] w-full tm-header-line" />

      <div
        data-header="sticky"
        data-visible={isStickyVisible ? "true" : "false"}
        className={`fixed inset-x-0 top-0 z-50 border-b border-slate-200/70 bg-white/95 font-raleway backdrop-blur-lg shadow-md shadow-slate-900/5 transition-all duration-200 dark:border-slate-800/70 dark:bg-slate-950/90 dark:shadow-black/30 ${isStickyVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
          }`}
      >
        {/* Mobile sticky layout */}
        <div className="relative flex md:hidden items-center gap-1.5 sm:gap-3 px-2 py-2">
          <div className="flex items-center justify-start ml-2 sm:ml-4 flex-shrink-0 gap-2 sm:gap-3">
            <button
              type="button"
              aria-expanded={isMenuOpen}
              aria-label={isMenuOpen ? "Cerrar menu" : "Abrir menu"}
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-[#00BFFF] hover:text-[#00BFFF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00BFFF] active:scale-[0.98] dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:border-[#33ceff] dark:hover:text-[#33ceff] dark:focus-visible:outline-[#33ceff]"
            >
              {isMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                  <path d="M6 6l12 12M6 18L18 6" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              )}
            </button>

            <div className="group flex h-9 w-9 sm:h-10 sm:w-auto items-center justify-center rounded-full border border-slate-200 bg-white/80 px-0 sm:px-4 text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-[#00BFFF] dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:border-[#33ceff]">
              <Link
                href="/calendario"
                className="flex items-center gap-1.5 sm:gap-2 text-[0.65rem] sm:text-[0.74rem] font-semibold tracking-[0.08em] transition group-hover:text-[#00BFFF] dark:group-hover:text-[#33ceff]"
                style={{ fontFamily: "'Space Grotesk', 'Sora', system-ui, sans-serif" }}
                aria-label="Ir al calendario editorial"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="flex sm:hidden h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span className="hidden sm:inline whitespace-nowrap">{dateDisplay}</span>
                <span className="hidden sm:inline h-4 w-px bg-slate-300/80 dark:bg-slate-700/80" aria-hidden="true" />
                <span className="hidden sm:inline whitespace-nowrap">{timeDisplay}</span>
              </Link>
            </div>
          </div>

          <Link href="/" className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2" aria-label="Ir a la pagina principal">
            <Image src={logoSrc} alt="Tripoli Media" width={32} height={32} className="h-7 w-7 sm:h-8 sm:w-8 object-contain" />
          </Link>

          <div className="flex items-center justify-end gap-1.5 sm:gap-2.5 flex-shrink-0 ml-auto">
            {renderRightControls()}
          </div>
        </div>

        {/* Desktop sticky layout */}
        <div className="hidden md:flex items-center w-full py-2">
          <div className="flex-1 flex items-center justify-center min-w-0">
            <Link href="/" aria-label="Ir a la pagina principal">
              <Image src={logoSrc} alt="Tripoli Media" width={32} height={32} className="h-8 w-8 object-contain" />
            </Link>
          </div>
          <div className="flex-[0_1_70rem] max-w-[70rem] flex items-center justify-center min-w-0">
            {renderNav()}
          </div>
          <div className="flex-1 flex items-center justify-end min-w-0 pr-4">
            {renderRightControls()}
          </div>
        </div>

        {isMenuOpen && (
          <nav className="md:hidden absolute left-0 right-0 top-full mt-[5px] px-3 pb-3 z-50">
            <ul className="w-fit max-w-[70%] space-y-1 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-lg shadow-slate-900/5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-black/30">
              {navItems.map((item) => {
                const matchPath = item.path ?? item.href ?? "";
                const isActive =
                  item.key === "home"
                    ? pathname === "/"
                    : pathname === matchPath || pathname.startsWith(`${matchPath}/`);
                return (
                  <li key={item.key}>
                    <a
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center justify-between rounded-xl px-2 py-1.5 text-[0.5rem] sm:text-sm font-semibold uppercase tracking-[0.08em] sm:tracking-[0.12em] transition hover:bg-slate-100 hover:text-[#00BFFF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00BFFF] dark:hover:bg-slate-800 dark:hover:text-[#33ceff] dark:focus-visible:outline-[#33ceff] ${isActive ? "font-bold text-slate-900 dark:text-slate-50" : "text-slate-700 dark:text-slate-100"}`}
                    >
                      <span className="truncate">- {item.label}</span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </nav>
        )}
      </div>
      <style jsx>{`
        .tm-header-line {
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
          animation: tmHeaderFlow 10s linear infinite;
          box-shadow:
            0 6px 12px rgba(0, 0, 0, 0.09),
            0 10px 18px rgba(0, 0, 0, 0.07),
            0 12px 20px rgba(0, 0, 0, 0.06);
          filter: drop-shadow(0 8px 12px rgba(0, 0, 0, 0.1));
        }
        @keyframes tmHeaderFlow {
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
      `}</style>
    </>
  );
}

