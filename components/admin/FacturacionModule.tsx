'use client';

import { useState, useRef, useCallback } from 'react';

export interface ConceptoItem {
  claveSAT: string;
  descripcion: string;
  cantidad: number;
  unidad: string;
  valorUnitario: number;
  importe: number;
}

export interface InvoiceData {
  emisor: {
    rfc: string;
    nombre: string;
    regimenFiscal: string;
    codigoPostal: string;
  };
  receptor: {
    rfc: string;
    nombre: string;
    regimenFiscal: string;
    codigoPostal: string;
    usoCFDI: string;
  };
  factura: {
    folioFiscalUUID: string;
    serieYFolio: string;
    fechaEmision: string;
    lugarExpedicion: string;
    formaPago: string;
    metodoPago: string;
  };
  conceptos: ConceptoItem[];
  totales: {
    subtotal: number;
    iva: number;
    total: number;
    montoConLetra: string;
  };
  sellos: {
    selloCFDI: string;
    selloSAT: string;
    cadenaOriginal: string;
  };
}

type Phase = 'upload' | 'edit' | 'done';

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1E3A5F] border-b border-[#1E3A5F]/20 pb-1 mb-3">
    {children}
  </h3>
);

const Field = ({
  label,
  value,
  onChange,
  mono = false,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  mono?: boolean;
  multiline?: boolean;
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</label>
    {multiline ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className={`rounded border border-slate-200 px-2 py-1.5 text-xs text-slate-800 focus:border-[#1E3A5F] focus:outline-none focus:ring-1 focus:ring-[#1E3A5F] resize-y ${mono ? 'font-mono' : ''}`}
      />
    ) : (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`rounded border border-slate-200 px-2 py-1.5 text-xs text-slate-800 focus:border-[#1E3A5F] focus:outline-none focus:ring-1 focus:ring-[#1E3A5F] ${mono ? 'font-mono' : ''}`}
      />
    )}
  </div>
);

const NumField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</label>
    <input
      type="number"
      step="0.01"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className="rounded border border-slate-200 px-2 py-1.5 text-xs text-slate-800 font-mono focus:border-[#1E3A5F] focus:outline-none focus:ring-1 focus:ring-[#1E3A5F]"
    />
  </div>
);

export default function FacturacionModule() {
  const [phase, setPhase] = useState<Phase>('upload');
  const [data, setData] = useState<InvoiceData | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file || file.type !== 'application/pdf') {
      setError('Solo se aceptan archivos PDF.');
      return;
    }
    setError(null);
    setIsExtracting(true);

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const res = await fetch('/api/admin/extract-invoice', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Error ${res.status}`);
      }

      const body = await res.json();
      setData(body.data);
      setPhase('edit');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el PDF.');
    } finally {
      setIsExtracting(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleGenerate = async () => {
    if (!data) return;
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/generate-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Error ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `factura-tripoli-${data.factura.folioFiscalUUID || 'sin-folio'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setPhase('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar el PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  const setEmisor = (key: keyof InvoiceData['emisor'], value: string) =>
    setData((d) => d ? { ...d, emisor: { ...d.emisor, [key]: value } } : d);

  const setReceptor = (key: keyof InvoiceData['receptor'], value: string) =>
    setData((d) => d ? { ...d, receptor: { ...d.receptor, [key]: value } } : d);

  const setFactura = (key: keyof InvoiceData['factura'], value: string) =>
    setData((d) => d ? { ...d, factura: { ...d.factura, [key]: value } } : d);

  const setTotales = (key: keyof InvoiceData['totales'], value: string | number) =>
    setData((d) => d ? { ...d, totales: { ...d.totales, [key]: value } } : d);

  const setSellos = (key: keyof InvoiceData['sellos'], value: string) =>
    setData((d) => d ? { ...d, sellos: { ...d.sellos, [key]: value } } : d);

  const setConcepto = (idx: number, key: keyof ConceptoItem, value: string | number) =>
    setData((d) => {
      if (!d) return d;
      const conceptos = [...d.conceptos];
      conceptos[idx] = { ...conceptos[idx], [key]: value };
      return { ...d, conceptos };
    });

  const addConcepto = () =>
    setData((d) =>
      d
        ? {
            ...d,
            conceptos: [
              ...d.conceptos,
              { claveSAT: '', descripcion: '', cantidad: 1, unidad: 'Unidad de servicio', valorUnitario: 0, importe: 0 },
            ],
          }
        : d
    );

  const removeConcepto = (idx: number) =>
    setData((d) => d ? { ...d, conceptos: d.conceptos.filter((_, i) => i !== idx) } : d);

  // ── PHASE 1: Upload ──────────────────────────────────────────────────────────
  if (phase === 'upload') {
    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8">
            <a href="/admin" className="text-xs font-semibold text-slate-400 hover:text-[#1E3A5F] transition">
              ← Admin Dashboard
            </a>
            <h1 className="mt-3 text-2xl font-bold text-[#1E3A5F]">Facturación</h1>
            <p className="mt-1 text-sm text-slate-500">
              Sube el XML/PDF del SAT para generar la factura con plantilla Tripoli Media.
            </p>
          </div>

          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-8 py-16 text-center transition ${
              isDragging
                ? 'border-[#1E3A5F] bg-[#1E3A5F]/5'
                : 'border-slate-200 bg-white hover:border-[#1E3A5F]/50 hover:bg-slate-50'
            }`}
          >
            <div className="rounded-full bg-[#1E3A5F]/10 p-4">
              <svg className="h-8 w-8 text-[#1E3A5F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">
                {isExtracting ? 'Procesando PDF...' : 'Sube el PDF del SAT'}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Arrastra aquí o haz clic para seleccionar — solo .pdf
              </p>
            </div>
            {isExtracting && (
              <div className="h-1 w-48 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-full origin-left animate-pulse bg-[#1E3A5F] rounded-full" />
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />

          {error && (
            <p className="mt-4 rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── PHASE 3: Done ───────────────────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4">
        <div className="mx-auto max-w-2xl flex flex-col items-center gap-6 pt-20 text-center">
          <div className="rounded-full bg-emerald-100 p-5">
            <svg className="h-10 w-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">¡PDF generado con éxito!</h2>
            <p className="mt-1 text-sm text-slate-500">
              La factura se descargó automáticamente a tu carpeta de Descargas.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setData(null); setPhase('upload'); setError(null); }}
              className="rounded-lg border border-[#1E3A5F] px-5 py-2.5 text-sm font-semibold text-[#1E3A5F] hover:bg-[#1E3A5F] hover:text-white transition"
            >
              Subir otra factura
            </button>
            <button
              onClick={() => setPhase('edit')}
              className="rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
            >
              Editar y regenerar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── PHASE 2: Edit ───────────────────────────────────────────────────────────
  if (!data) return null;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <button
              onClick={() => { setData(null); setPhase('upload'); setError(null); }}
              className="text-xs font-semibold text-slate-400 hover:text-[#1E3A5F] transition"
            >
              ← Subir otra factura
            </button>
            <h1 className="mt-1 text-xl font-bold text-[#1E3A5F]">Revisar y Generar PDF</h1>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="rounded-lg bg-[#1E3A5F] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#2d4a6f] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Generando...' : 'Generar PDF Tripoli'}
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* EMISOR */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionTitle>Datos del Emisor</SectionTitle>
            <div className="flex flex-col gap-3">
              <Field label="RFC" value={data.emisor.rfc} onChange={(v) => setEmisor('rfc', v)} mono />
              <Field label="Nombre / Razón Social" value={data.emisor.nombre} onChange={(v) => setEmisor('nombre', v)} />
              <Field label="Régimen Fiscal" value={data.emisor.regimenFiscal} onChange={(v) => setEmisor('regimenFiscal', v)} />
              <Field label="Código Postal" value={data.emisor.codigoPostal} onChange={(v) => setEmisor('codigoPostal', v)} mono />
            </div>
          </div>

          {/* RECEPTOR */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionTitle>Datos del Receptor</SectionTitle>
            <div className="flex flex-col gap-3">
              <Field label="RFC" value={data.receptor.rfc} onChange={(v) => setReceptor('rfc', v)} mono />
              <Field label="Nombre / Razón Social" value={data.receptor.nombre} onChange={(v) => setReceptor('nombre', v)} />
              <Field label="Régimen Fiscal" value={data.receptor.regimenFiscal} onChange={(v) => setReceptor('regimenFiscal', v)} />
              <Field label="Código Postal" value={data.receptor.codigoPostal} onChange={(v) => setReceptor('codigoPostal', v)} mono />
              <Field label="Uso de CFDI" value={data.receptor.usoCFDI} onChange={(v) => setReceptor('usoCFDI', v)} />
            </div>
          </div>

          {/* FACTURA */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionTitle>Datos de la Factura</SectionTitle>
            <div className="flex flex-col gap-3">
              <Field label="Folio Fiscal (UUID)" value={data.factura.folioFiscalUUID} onChange={(v) => setFactura('folioFiscalUUID', v)} mono />
              <Field label="Serie y Folio" value={data.factura.serieYFolio} onChange={(v) => setFactura('serieYFolio', v)} />
              <Field label="Fecha de Emisión" value={data.factura.fechaEmision} onChange={(v) => setFactura('fechaEmision', v)} />
              <Field label="Lugar de Expedición" value={data.factura.lugarExpedicion} onChange={(v) => setFactura('lugarExpedicion', v)} />
              <Field label="Forma de Pago" value={data.factura.formaPago} onChange={(v) => setFactura('formaPago', v)} />
              <Field label="Método de Pago" value={data.factura.metodoPago} onChange={(v) => setFactura('metodoPago', v)} />
            </div>
          </div>

          {/* TOTALES */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionTitle>Totales</SectionTitle>
            <div className="flex flex-col gap-3">
              <NumField label="Subtotal (MXN)" value={data.totales.subtotal} onChange={(v) => setTotales('subtotal', v)} />
              <NumField label="IVA 16% (MXN)" value={data.totales.iva} onChange={(v) => setTotales('iva', v)} />
              <NumField label="Total (MXN)" value={data.totales.total} onChange={(v) => setTotales('total', v)} />
              <Field
                label="Monto con Letra"
                value={data.totales.montoConLetra}
                onChange={(v) => setTotales('montoConLetra', v)}
              />
            </div>
          </div>
        </div>

        {/* CONCEPTOS */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <SectionTitle>Conceptos</SectionTitle>
            <button
              onClick={addConcepto}
              className="text-xs font-semibold text-[#1E3A5F] hover:underline"
            >
              + Agregar concepto
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500">
                  <th className="pb-2 text-left font-semibold uppercase tracking-wider pr-2">Clave SAT</th>
                  <th className="pb-2 text-left font-semibold uppercase tracking-wider pr-2">Descripción</th>
                  <th className="pb-2 text-left font-semibold uppercase tracking-wider pr-2">Cant.</th>
                  <th className="pb-2 text-left font-semibold uppercase tracking-wider pr-2">Unidad</th>
                  <th className="pb-2 text-left font-semibold uppercase tracking-wider pr-2">V. Unit.</th>
                  <th className="pb-2 text-left font-semibold uppercase tracking-wider pr-2">Importe</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {data.conceptos.map((c, idx) => (
                  <tr key={idx} className="border-b border-slate-50">
                    <td className="py-1.5 pr-2">
                      <input
                        value={c.claveSAT}
                        onChange={(e) => setConcepto(idx, 'claveSAT', e.target.value)}
                        className="w-20 rounded border border-slate-200 px-1.5 py-1 font-mono text-xs focus:border-[#1E3A5F] focus:outline-none"
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <input
                        value={c.descripcion}
                        onChange={(e) => setConcepto(idx, 'descripcion', e.target.value)}
                        className="w-48 rounded border border-slate-200 px-1.5 py-1 text-xs focus:border-[#1E3A5F] focus:outline-none"
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <input
                        type="number"
                        value={c.cantidad}
                        onChange={(e) => setConcepto(idx, 'cantidad', parseFloat(e.target.value) || 0)}
                        className="w-14 rounded border border-slate-200 px-1.5 py-1 font-mono text-xs focus:border-[#1E3A5F] focus:outline-none"
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <input
                        value={c.unidad}
                        onChange={(e) => setConcepto(idx, 'unidad', e.target.value)}
                        className="w-28 rounded border border-slate-200 px-1.5 py-1 text-xs focus:border-[#1E3A5F] focus:outline-none"
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <input
                        type="number"
                        step="0.01"
                        value={c.valorUnitario}
                        onChange={(e) => setConcepto(idx, 'valorUnitario', parseFloat(e.target.value) || 0)}
                        className="w-20 rounded border border-slate-200 px-1.5 py-1 font-mono text-xs focus:border-[#1E3A5F] focus:outline-none"
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <input
                        type="number"
                        step="0.01"
                        value={c.importe}
                        onChange={(e) => setConcepto(idx, 'importe', parseFloat(e.target.value) || 0)}
                        className="w-20 rounded border border-slate-200 px-1.5 py-1 font-mono text-xs focus:border-[#1E3A5F] focus:outline-none"
                      />
                    </td>
                    <td className="py-1.5">
                      <button
                        onClick={() => removeConcepto(idx)}
                        className="text-slate-300 hover:text-rose-500 transition text-base"
                        title="Eliminar"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.conceptos.length === 0 && (
              <p className="py-6 text-center text-xs text-slate-400">Sin conceptos. Agrega uno arriba.</p>
            )}
          </div>
        </div>

        {/* SELLOS */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <SectionTitle>Sellos Digitales</SectionTitle>
          <div className="flex flex-col gap-3">
            <Field
              label="Sello Digital del CFDI"
              value={data.sellos.selloCFDI}
              onChange={(v) => setSellos('selloCFDI', v)}
              mono
              multiline
            />
            <Field
              label="Sello Digital del SAT"
              value={data.sellos.selloSAT}
              onChange={(v) => setSellos('selloSAT', v)}
              mono
              multiline
            />
            <Field
              label="Cadena Original del Complemento"
              value={data.sellos.cadenaOriginal}
              onChange={(v) => setSellos('cadenaOriginal', v)}
              mono
              multiline
            />
          </div>
        </div>

        {/* Footer action */}
        <div className="mt-6 flex items-center justify-end gap-4">
          {error && (
            <p className="text-sm font-medium text-rose-600">{error}</p>
          )}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="rounded-lg bg-[#1E3A5F] px-8 py-3 text-sm font-semibold text-white hover:bg-[#2d4a6f] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Generando PDF...' : 'Generar PDF Tripoli'}
          </button>
        </div>
      </div>
    </div>
  );
}
