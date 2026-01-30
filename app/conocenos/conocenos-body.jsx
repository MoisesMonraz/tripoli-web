"use client";

import { useMemo } from "react";
import { useLanguage } from "../../components/LanguageProvider";

const content = {
  ES: [
    "En Tripoli Media entendemos los retos que hoy enfrentan empresarios, directivos y tomadores de decisión: alta competencia digital, necesidad de resultados medibles, presión por optimizar la inversión y poco margen para acciones sin sustento. Nuestra misión es posicionar tu marca con criterio estratégico, enfocado en generar valor real y retorno para tu negocio.",
    "Somos un ecosistema digital que integra contenido editorial especializado, analítica avanzada y soluciones web, diseñado para ayudarte a ganar visibilidad, ordenar tu información y transformar esfuerzos digitales en acciones claras, efectivas y medibles.",
    "Trabajamos contigo para que cada iniciativa tenga un propósito definido. Analizamos tu contexto, tus objetivos y tu situación particular para llegar de forma precisa a tu mercado, construyendo mensajes relevantes, estructuras digitales sólidas y procesos de medición que te permitan tomar decisiones con mayor certeza.",
    "No creemos en soluciones genéricas. Creamos estrategias especializadas y a la medida, alineadas a tu realidad operativa, que reducen la fricción en la toma de decisiones y fortalecen la confianza del usuario en los activos y recursos que tu empresa invierte.",
    "Nuestro enfoque es ejecutivo, analítico y orientado a resultados. Si buscas claridad, seguridad, estructura y un aliado que comprenda tu entorno empresarial, en Tripoli Media estás en el lugar correcto.",
  ],
  EN: [
    "At Tripoli Media, we understand the challenges entrepreneurs, executives, and decision-makers face today: intense digital competition, the need for measurable results, pressure to optimize investment, and little room for unsupported actions. Our mission is to position your brand with strategic criteria, focused on generating real value and return for your business.",
    "We are a digital ecosystem that integrates specialized editorial content, advanced analytics, and web solutions, designed to help you gain visibility, organize your information, and turn digital efforts into clear, effective, and measurable actions.",
    "We work with you so that every initiative has a defined purpose. We analyze your context, objectives, and unique situation to reach your market precisely, building relevant messages, solid digital structures, and measurement processes that enable you to make decisions with greater certainty.",
    "At Tripoli Media, we do not believe in generic solutions. We create specialized, tailored strategies aligned with your operational reality, reducing friction in decision-making and strengthening user confidence in the assets and resources your company invests.",
    "Our approach is executive, analytical, and results-oriented. If you seek clarity, security, structure, and a partner who understands your business environment, Tripoli Media is the right place for you.",
  ],
};

export default function ConocenosBody() {
  const { language } = useLanguage();
  const isEN = language === "EN";
  const paragraphs = useMemo(() => (isEN ? content.EN : content.ES), [isEN]);

  return (
    <main className="flex flex-col gap-8 sm:gap-10 pb-12 sm:pb-16 pt-8 sm:pt-12 font-raleway bg-white dark:bg-slate-950">
      <section className="max-w-[70rem] mx-auto w-full px-5 sm:px-7 md:px-5">
        <div className="flex flex-col gap-2 sm:gap-3">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">
            {isEN ? "About us" : "CONÓCENOS"}
          </p>
          <h1 className="text-xl sm:text-2xl lg:text-[28px] font-semibold uppercase bg-gradient-to-r from-[#0082b9] via-[#00b6ed] to-[#0082b9] bg-[length:200%_100%] bg-clip-text text-transparent animate-servicesTitleSweep">
            {isEN ? "Our Value Offering" : "Nuestra oferta de valor"}
          </h1>
          <div className="text-[10px] sm:text-[15px] leading-relaxed text-slate-600 dark:text-slate-300 space-y-3 sm:space-y-4">
            {paragraphs.map((paragraph, idx) => (
              <p key={idx} className="text-justify">{paragraph}</p>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
