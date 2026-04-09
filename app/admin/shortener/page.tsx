'use client';

import { useState, useEffect } from 'react';

interface ShortURL {
  originalUrl: string;
  code: string;
  shortUrl: string;
  createdAt: number;
  clicks: number;
}

export default function ShortenerAdmin() {
  const [session, setSession] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [url, setUrl] = useState('');
  const [urls, setUrls] = useState<ShortURL[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/status');
        if (!res.ok) { setSession(null); } else { setSession(await res.json()); }
      } catch { setSession(null); }
      finally { setIsChecking(false); }
    })();
    fetchURLs();
  }, []);

  const fetchURLs = async () => {
    try {
      const res = await fetch('/api/shortener/list');
      const data = await res.json();
      if (data.success) {
        setUrls(data.data);
      }
    } catch (err) {
      console.error('Error fetching URLs:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/shortener/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error creating short URL');
        return;
      }

      setSuccess(`URL creada: ${data.data.shortUrl}`);
      setUrl('');
      fetchURLs();
    } catch {
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (shortUrl: string, code: string) => {
    await navigator.clipboard.writeText(shortUrl);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDelete = async (code: string) => {
    if (!confirm('¿Eliminar este enlace?')) return;
    try {
      const res = await fetch(`/api/shortener/${code}`, { method: 'DELETE' });
      if (res.ok) fetchURLs();
    } catch (err) {
      console.error('Error deleting URL:', err);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isChecking) return <main className="min-h-screen bg-white px-6 py-16"><p className="text-sm text-slate-500">Verificando sesión...</p></main>;
  if (!session?.ok) return <main className="min-h-screen bg-white px-6 py-16"><p className="text-sm text-slate-500">Acceso no autorizado. <a href="/admin" className="text-[#1E3A5F] underline">Volver</a></p></main>;
  if (session.email !== 'monrazescoto@gmail.com') return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-md text-center">
        <p className="text-lg font-semibold text-slate-700 mb-6">Lo sentimos, actualmente no tienes autorización para acceder a esta sección.</p>
        <a href="/admin" className="rounded-lg bg-[#1E3A5F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#162d4a] transition">Regresar</a>
      </div>
    </main>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Acortador de URLs</h1>
          <p className="text-gray-600 mt-1">Tripoli Media — Panel de Administración</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <form onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL del artículo (tripoli.media)
            </label>
            <div className="flex gap-3">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.tripoli.media/categoria/subcategoria/articulo/..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent outline-none text-sm"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-[#1E3A5F] text-white rounded-lg font-medium hover:bg-[#2d4a6f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creando...' : 'Acortar'}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
          )}
          {success && (
            <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">{success}</div>
          )}
        </div>

        {/* URL List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-800">URLs Creadas ({urls.length})</h2>
          </div>

          {urls.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              No hay URLs creadas todavía
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {urls.map((item) => (
                <div key={item.code} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-[#1E3A5F] font-medium">{item.shortUrl}</code>
                        <button
                          onClick={() => handleCopy(item.shortUrl, item.code)}
                          className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                        >
                          {copied === item.code ? '✓ Copiado' : 'Copiar'}
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{item.originalUrl}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span>{formatDate(item.createdAt)}</span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {item.clicks} clicks
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(item.code)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      title="Eliminar"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
