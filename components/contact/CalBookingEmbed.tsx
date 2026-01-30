"use client";

import AnimatedNavyCard from "./AnimatedNavyCard";
import { useLanguage } from "../LanguageProvider";

const CAL_LINK = "https://cal.com/tripolimedia/reunion-de-1-hr";

const IconClock = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`h-4 w-4 ${className}`}
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

const IconVideo = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`h-4 w-4 ${className}`}
  >
    <rect x="3" y="7" width="13" height="10" rx="2" />
    <path d="m16 10 5-3v10l-5-3z" />
  </svg>
);

export default function CalBookingEmbed() {
  const { language } = useLanguage();
  const isEN = language === "EN";

  return (
    <AnimatedNavyCard
      as="section"
      className="rounded-none border border-white/10 bg-slate-950 px-5 py-[24px] text-white shadow-sm shadow-black/20 h-auto flex flex-col gap-3 self-start"
    >
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Tripoli Media</p>
        <h2 className="text-[22px] font-semibold font-raleway text-white">{isEN ? "Initial strategic session" : "Sesion estrategica inicial"}</h2>
        <p className="text-sm font-semibold text-slate-100 text-justify">{isEN ? "Discover how Tripoli Media services and solutions can boost your company" : "Conozca como los servicios y soluciones de Tripoli Media pueden impulsar su empresa"}</p>
      </div>

      <p className="text-sm leading-snug text-slate-300 text-justify">{isEN ? "Schedule your first virtual meeting at no cost with one of our executives to assess your needs, identify opportunities, and define possible collaboration paths." : "Agende su primera reunion virtual sin costo con uno de nuestros ejecutivos para evaluar sus necesidades, identificar oportunidades y definir posibles lineas de colaboracion."}</p>

      <div className="space-y-1 text-sm text-slate-200">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <IconClock className="text-slate-400" />
            <span className="font-semibold">{isEN ? "1-hour meeting slot" : "Cita con espacio de 1 hora"}</span>
          </div>
          <div className="flex items-center gap-2">
            <IconVideo className="text-slate-400" />
            <span className="font-semibold">Google Meet</span>
          </div>
        </div>
      </div>

      <a
        href={CAL_LINK}
        target="_blank"
        rel="noreferrer"
        className="inline-flex w-full items-center justify-center rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500"
      >
        {isEN ? "Book your session today" : "Agendar cita"}
      </a>

    </AnimatedNavyCard>
  );
}


