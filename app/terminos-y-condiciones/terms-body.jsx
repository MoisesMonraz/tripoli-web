"use client";

import { useMemo } from "react";
import { useLanguage } from "../../components/LanguageProvider";

const content = {
  ES: [
    "El acceso y uso del sitio web de Tripoli Media implica la aceptación plena y sin reservas de los presentes Términos y Condiciones. La información, contenidos y servicios descritos en este sitio tienen carácter informativo y están relacionados con servicios de publicidad digital, campañas publicitarias, analítica de datos, medición de resultados y comunicación digital. Tripoli Media se reserva el derecho de modificar, actualizar o eliminar, en cualquier momento y sin previo aviso, la información, servicios y contenidos publicados.",
    "Los servicios de publicidad, gestión de campañas y analítica ofrecidos por Tripoli Media se prestarán conforme a los alcances, objetivos y condiciones que, en su caso, sean acordados de manera específica con cada cliente. Tripoli Media no garantiza resultados específicos derivados de campañas publicitarias o estrategias digitales, ya que estos pueden variar en función de factores externos como presupuesto, mercado, competencia, plataformas publicitarias y comportamiento del usuario.",
    "Todos los contenidos, textos, diseños, logotipos y materiales publicados en este sitio son propiedad de Tripoli Media o se utilizan con la debida autorización, y se encuentran protegidos por la legislación aplicable en materia de propiedad intelectual. Queda prohibido su uso, reproducción o distribución sin autorización expresa.",
  ],
  EN: [
    "Access to and use of Tripoli Media's website implies full and unconditional acceptance of these Terms and Conditions. The information, content, and services described on this site are for informational purposes and relate to digital advertising services, advertising campaigns, data analytics, results measurement, and digital communications. Tripoli Media reserves the right to modify, update, or remove the information, services, and content published at any time and without prior notice.",
    "The advertising, campaign management, and analytics services offered by Tripoli Media will be provided according to the scope, objectives, and conditions specifically agreed with each client. Tripoli Media does not guarantee specific outcomes from advertising campaigns or digital strategies, as these may vary due to external factors such as budget, market conditions, competition, advertising platforms, and user behavior.",
    "All content, text, designs, logos, and materials published on this site are the property of Tripoli Media or are used with proper authorization, and are protected by applicable intellectual property laws. Their use, reproduction, or distribution without express authorization is prohibited.",
  ],
};

export default function TermsBody() {
  const { language } = useLanguage();
  const isEN = language === "EN";

  const paragraphs = useMemo(() => (isEN ? content.EN : content.ES), [isEN]);

  return (
    <main className="flex flex-col gap-8 sm:gap-10 pb-12 sm:pb-16 pt-8 sm:pt-12 font-raleway bg-white dark:bg-slate-950">
      <section className="max-w-[70rem] mx-auto w-full px-5 sm:px-7 md:px-5">
        <div className="flex flex-col gap-2 sm:gap-3">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">
            {isEN ? "Terms and Conditions" : "Términos y Condiciones"}
          </p>
          <h1 className="text-xl sm:text-2xl lg:text-[28px] font-semibold uppercase bg-gradient-to-r from-[#0082b9] via-[#00b6ed] to-[#0082b9] bg-[length:200%_100%] bg-clip-text text-transparent animate-servicesTitleSweep">
            {isEN ? "Legal term" : "Término legal"}
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

