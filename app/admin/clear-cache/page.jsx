"use client";

import { useState } from "react";
import { clearAllTranslationCache, deleteCachedTranslation } from "../../../lib/translationCache";

export default function ClearCachePage() {
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [slug, setSlug] = useState("");

  const handleClearAll = async () => {
    if (!confirm("Esto borrara TODAS las traducciones guardadas. Los articulos tendran que ser re-traducidos. Continuar?")) {
      return;
    }

    setIsLoading(true);
    setStatus("Limpiando cache...");

    try {
      const result = await clearAllTranslationCache();
      if (result.success) {
        setStatus(`Exito! Se eliminaron ${result.deleted} traducciones del cache.`);
      } else {
        setStatus("Error al limpiar el cache.");
      }
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }

    setIsLoading(false);
  };

  const handleClearOne = async () => {
    if (!slug.trim()) {
      setStatus("Por favor ingresa el slug del articulo.");
      return;
    }

    setIsLoading(true);
    setStatus(`Eliminando cache de: ${slug}...`);

    try {
      const success = await deleteCachedTranslation(slug.trim());
      if (success) {
        setStatus(`Cache eliminado para: ${slug}`);
        setSlug("");
      } else {
        setStatus(`No se encontro cache para: ${slug}`);
      }
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-slate-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-neutral-800 dark:text-white">
          Admin: Limpiar Cache de Traducciones
        </h1>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 mb-6 shadow">
          <h2 className="text-xl font-semibold mb-4 text-neutral-800 dark:text-white">
            Limpiar UN articulo
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            Ingresa el slug del articulo (ej: el-orgullo-del-pacifico)
          </p>
          <div className="flex gap-4">
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="slug-del-articulo"
              className="flex-1 px-4 py-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              disabled={isLoading}
            />
            <button
              onClick={handleClearOne}
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Limpiar
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 mb-6 shadow">
          <h2 className="text-xl font-semibold mb-4 text-neutral-800 dark:text-white">
            Limpiar TODOS los articulos
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            Esto eliminara todas las traducciones guardadas. Los articulos tendran que ser re-traducidos cuando los usuarios visiten con EN activado.
          </p>
          <button
            onClick={handleClearAll}
            disabled={isLoading}
            className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            Limpiar Todo el Cache
          </button>
        </div>

        {status && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-yellow-800 dark:text-yellow-200">{status}</p>
          </div>
        )}

        <div className="mt-8 text-sm text-neutral-500 dark:text-neutral-400">
          <p>Instrucciones:</p>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>Si necesitas re-traducir un articulo especifico, usa la opcion individual</li>
            <li>Si hiciste cambios al sistema de traduccion (como agregar pies de foto), limpia todo</li>
            <li>Despues de limpiar, visita cada articulo con EN para generar nuevas traducciones</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
