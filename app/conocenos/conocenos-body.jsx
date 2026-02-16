"use client";

const content = {
  ES: [
    "En Tripoli Media entendemos los retos que hoy enfrentan empresarios, directivos y tomadores de decisión: alta competencia digital, necesidad de resultados medibles, presión por optimizar la inversión y poco margen para acciones sin sustento. Nuestra misión es posicionar tu marca con criterio estratégico, enfocado en generar valor real y retorno para tu negocio.",
    "Somos un ecosistema digital que integra contenido editorial especializado, analítica avanzada y soluciones web, diseñado para ayudarte a ganar visibilidad, ordenar tu información y transformar esfuerzos digitales en acciones claras, efectivas y medibles.",
    "Trabajamos contigo para que cada iniciativa tenga un propósito definido. Analizamos tu contexto, tus objetivos y tu situación particular para llegar de forma precisa a tu mercado, construyendo mensajes relevantes, estructuras digitales sólidas y procesos de medición que te permitan tomar decisiones con mayor certeza.",
    "No creemos en soluciones genéricas. Creamos estrategias especializadas y a la medida, alineadas a tu realidad operativa, que reducen la fricción en la toma de decisiones y fortalecen la confianza del usuario en los activos y recursos que tu empresa invierte.",
    "Nuestro enfoque es ejecutivo, analítico y orientado a resultados. Si buscas claridad, seguridad, estructura y un aliado que comprenda tu entorno empresarial, en Tripoli Media estás en el lugar correcto.",
  ],
};

export default function ConocenosBody() {
  const paragraphs = content.ES;

  return (
    <main className="flex flex-col gap-8 sm:gap-10 pb-12 sm:pb-16 pt-8 sm:pt-12 font-raleway bg-white dark:bg-slate-950">
      <section className="max-w-[70rem] mx-auto w-full px-5 sm:px-7 md:px-5">
        <div className="flex flex-col gap-2 sm:gap-3">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">
            CONÓCENOS
          </p>
          <h1 className="text-xl sm:text-2xl lg:text-[28px] font-semibold uppercase bg-gradient-to-r from-[#0082b9] via-[#00b6ed] to-[#0082b9] bg-[length:200%_100%] bg-clip-text text-transparent animate-servicesTitleSweep">
            Nuestra oferta de valor
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
