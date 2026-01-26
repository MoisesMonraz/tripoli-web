export default function CategoryPage({ params }) {
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const labels = {
    "consumo-y-retail": "Consumo y Retail",
    "entretenimiento-y-cultura": "Entretenimiento y Cultura",
    "industria-ti": "Industria TI",
    "infraestructura-social": "Infraestructura Social",
    "politica-y-leyes": "Politica y Leyes",
    "sector-salud": "Sector Salud",
  };
  const title = labels[slug] || "Categoria";

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Categoria</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-50">{title}</h1>
        </div>
        <a href="/" className="text-sm font-semibold text-[#00BFFF] hover:text-[#33ceff] transition">
          Volver al inicio
        </a>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200/70 bg-white/70 p-8 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/70">
        <p className="text-slate-600 dark:text-slate-300">
          Pronto cargaremos contenido de <span className="font-semibold">{title}</span>. Mientras tanto, navega por nuestras otras categorias.
        </p>
      </div>
    </main>
  );
}
