import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminSessionCookieName, verifyAdminSession } from '../../../../lib/security/adminSession';
import type { InvoiceData } from '../../../../components/admin/FacturacionModule';

// Import pdf-parse from lib path to avoid Next.js test-file loading issue
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse/lib/pdf-parse.js') as (
  buffer: Buffer,
  options?: Record<string, unknown>
) => Promise<{ text: string; numpages: number }>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extract(text: string, pattern: RegExp): string {
  const m = text.match(pattern);
  return m ? m[1].trim().replace(/\s+/g, ' ') : '';
}

function extractMoney(text: string, pattern: RegExp): number {
  const m = text.match(pattern);
  if (!m) return 0;
  return parseFloat(m[1].replace(/,/g, '')) || 0;
}

// Number → Spanish words (covers 0 – 999,999)
function numToWords(n: number): string {
  const ones = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE',
    'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE',
    'DIECIOCHO', 'DIECINUEVE'];
  const tens = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA',
    'OCHENTA', 'NOVENTA'];
  const hundreds = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS',
    'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  if (n === 0) return 'CERO';
  if (n === 100) return 'CIEN';

  let result = '';
  if (n >= 1000) {
    const thousands = Math.floor(n / 1000);
    result += thousands === 1 ? 'MIL ' : numToWords(thousands) + ' MIL ';
    n = n % 1000;
  }
  if (n >= 100) {
    result += hundreds[Math.floor(n / 100)] + ' ';
    n = n % 100;
  }
  if (n >= 20) {
    result += tens[Math.floor(n / 10)];
    if (n % 10 !== 0) result += ' Y ' + ones[n % 10];
    result += ' ';
  } else if (n > 0) {
    result += ones[n] + ' ';
  }
  return result.trim();
}

function totalToLetras(total: number): string {
  const intPart = Math.floor(total);
  const decPart = Math.round((total - intPart) * 100);
  const words = numToWords(intPart);
  return `${words} PESOS ${String(decPart).padStart(2, '0')}/100 M.N.`;
}

// ─── Main parser ──────────────────────────────────────────────────────────────

function parseInvoice(raw: string): InvoiceData {
  // Collapse excess whitespace but keep newlines for multi-line field parsing
  const text = raw.replace(/[ \t]+/g, ' ').trim();
  const flat = text.replace(/\n/g, ' ');

  // ── Emisor ────────────────────────────────────────────────────────────────
  // The folio-fiscal line near the end usually has "RFC emisor:" followed by "Folio fiscal:"
  const rfcEmisor =
    extract(flat, /RFC\s+emisor:\s*([A-Z0-9&Ñ]{10,14})(?:\s|$)/i) ||
    extract(flat, /RFC:\s*([A-Z0-9&Ñ]{10,14})/i);

  const nombreEmisor =
    extract(flat, /Nombre\s+emisor:\s*([\wÁÉÍÓÚÜÑáéíóúüñ\s]+?)(?=RFC\s+receptor:|$)/i) ||
    extract(flat, /Nombre\/Razón\s+Social:\s*([\wÁÉÍÓÚÜÑáéíóúüñ\s,\.]+?)(?=Régimen|RFC|$)/i);

  // "Código postal, fecha y hora de emisión: 45040 2026-03-19 13:49:23"
  const cpFechaMatch = flat.match(
    /Código\s+postal,\s+fecha\s+y\s+hora\s+de\s+emisión:\s*(\d{5})\s+([\d-]+\s+[\d:]+)/i
  );
  const cpEmisor = cpFechaMatch ? cpFechaMatch[1] : extract(flat, /Dirección\s+Fiscal:.*?(\d{5})/i);
  const fechaEmision = cpFechaMatch ? cpFechaMatch[2].trim() : extract(flat, /Fecha\s+de\s+emisión:\s*([\d\/\-\s:]+)/i);

  // Régimen fiscal del emisor: the one that appears WITHOUT "receptor" qualifier
  const regimenEmisor =
    extract(flat, /Régimen\s+fiscal:\s*([\wÁÉÍÓÚÜÑáéíóúüñ\s]+?)(?=Exportación|No\s+aplica|$)/i) ||
    extract(flat, /Régimen\s+Fiscal:\s*([\wÁÉÍÓÚÜÑáéíóúüñ\s]+?)(?=Dirección|RFC|$)/i);

  // ── Receptor ──────────────────────────────────────────────────────────────
  const rfcReceptor = extract(flat, /RFC\s+receptor:\s*([A-Z0-9&Ñ]{10,14})/i);
  const nombreReceptor = extract(
    flat,
    /Nombre\s+receptor:\s*([\wÁÉÍÓÚÜÑáéíóúüñ\s]+?)(?=Código\s+postal\s+del|Régimen|Uso\s+CFDI|$)/i
  );
  const cpReceptor = extract(flat, /Código\s+postal\s+del\s+receptor:\s*(\d{5})/i);
  const regimenReceptor = extract(
    flat,
    /Régimen\s+fiscal\s+receptor:\s*([\wÁÉÍÓÚÜÑáéíóúüñ\s]+?)(?=Uso\s+CFDI|No\.\s+de\s+serie|$)/i
  );
  const usoCFDI = extract(flat, /Uso\s+(?:de\s+)?CFDI:\s*([\wÁÉÍÓÚÜÑáéíóúüñ\s\.]+?)(?=No\.\s+de\s+serie|$)/i);

  // ── Factura ───────────────────────────────────────────────────────────────
  const folioFiscalUUID =
    extract(flat, /Folio\s+fiscal:\s*([0-9A-F-]{36})/i) ||
    extract(flat, /([0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12})/i);
  const serieYFolio = extract(flat, /Serie\s+y\s+Folio:\s*([\w\s\-]+?)(?=Fecha|$)/i);
  const lugarExpedicion = extract(flat, /Lugar\s+de\s+expedición:\s*([\w\s,\.]+?)(?=Forma|$)/i) || cpEmisor;
  const formaPago = extract(flat, /Forma\s+de\s+pago:\s*([\wÁÉÍÓÚÜÑáéíóúüñ\s]+?)(?=Método|$)/i);
  const metodoPago = extract(flat, /Método\s+de\s+pago:\s*([\wÁÉÍÓÚÜÑáéíóúüñ\s]+?)(?=Subtotal|Moneda|$)/i);

  // ── Conceptos ─────────────────────────────────────────────────────────────
  // Pattern: clave-SAT ... 1 E48 Unidad-de-servicio cantidad valorUnitario
  // then next line: "Descripción <text>"
  const conceptos: InvoiceData['conceptos'] = [];

  // Try to find concepto lines by matching clave SAT (numeric 8 digits typically)
  // Row pattern: "81111806 1 E48 Unidad de servicio 1 1.000000"
  const conceptoPattern =
    /(\d{5,8})\s+[\w\d]*?\s*(\d+(?:\.\d+)?)\s+([A-Z]\d+)\s+([\w\s]+?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(?:Sí|No)\s+objeto/gi;

  let cMatch;
  while ((cMatch = conceptoPattern.exec(flat)) !== null) {
    // Find the description which appears after "Descripción" on the next occurrence
    const afterMatch = flat.slice(cMatch.index);
    const descMatch = afterMatch.match(/Descripción\s+([\wÁÉÍÓÚÜÑáéíóúüñ\s,\.]+?)(?=Impuesto|Número|$)/i);
    conceptos.push({
      claveSAT: cMatch[1],
      descripcion: descMatch ? descMatch[1].trim() : '',
      cantidad: parseFloat(cMatch[2]) || 1,
      unidad: cMatch[4].trim(),
      valorUnitario: parseFloat(cMatch[5]) || 0,
      importe: parseFloat(cMatch[6]) || 0,
    });
  }

  // Fallback: simpler single-concepto extraction
  if (conceptos.length === 0) {
    const claveSAT = extract(flat, /Conceptos[\s\S]{0,300}?(\d{7,8})\s/i);
    const descripcion = extract(flat, /Descripción\s+([\wÁÉÍÓÚÜÑáéíóúüñ\s,\.]+?)(?=Impuesto|IVA|$)/i);
    const valorMatch = flat.match(/(\d+(?:\.\d+)?)\s+(?:Sí|No)\s+objeto/i);
    const valorUnitario = valorMatch ? parseFloat(valorMatch[1]) : 0;
    if (claveSAT || descripcion) {
      conceptos.push({
        claveSAT,
        descripcion,
        cantidad: 1,
        unidad: extract(flat, /E48\s+([\w\s]+?)(?=\d)/i) || 'Unidad de servicio',
        valorUnitario,
        importe: valorUnitario,
      });
    }
  }

  // ── Totales ───────────────────────────────────────────────────────────────
  const subtotal = extractMoney(flat, /Subtotal\s*\$\s*([\d,]+(?:\.\d+)?)/i);
  const ivaImporte = extractMoney(flat, /IVA\s+16[.,]\d+%\s*\$\s*([\d,]+(?:\.\d+)?)/i);
  const total = extractMoney(flat, /Total\s*\$\s*([\d,]+(?:\.\d+)?)/i);

  // Try to extract "XXXX PESOS XX/100 M.N." literal from the PDF
  const letraMatch = flat.match(
    /([A-ZÁÉÍÓÚÜÑ\s]+PESOS\s+\d{2}\/100\s+M\.N\.)/i
  );
  const montoConLetra = letraMatch ? letraMatch[1].trim() : totalToLetras(total || subtotal);

  // ── Sellos ────────────────────────────────────────────────────────────────
  // Each sello is a long base64 string. They appear after their label on the same or next line.
  const sellosCFDIMatch = text.match(
    /Sello\s+digital\s+del\s+CFDI:\s*\n?([\w+/=\s]{40,}?)(?=\n\n|\nSello\s+digital\s+del\s+SAT)/i
  );
  const sellosSATMatch = text.match(
    /Sello\s+digital\s+del\s+SAT:\s*\n?([\w+/=\s]{40,}?)(?=\n\n|\nCadena\s+Original)/i
  );
  const cadenaMatch = text.match(
    /Cadena\s+Original\s+del\s+complemento[^:]*:\s*\n?(\|\|[\s\S]+?)(?=\n\n|RFC\s+del\s+proveedor|$)/i
  );

  const selloCFDI = sellosCFDIMatch ? sellosCFDIMatch[1].replace(/\s+/g, '') : '';
  const selloSAT = sellosSATMatch ? sellosSATMatch[1].replace(/\s+/g, '') : '';
  const cadenaOriginal = cadenaMatch ? cadenaMatch[1].trim() : '';

  return {
    emisor: {
      rfc: rfcEmisor,
      nombre: nombreEmisor,
      regimenFiscal: regimenEmisor,
      codigoPostal: cpEmisor,
    },
    receptor: {
      rfc: rfcReceptor,
      nombre: nombreReceptor,
      regimenFiscal: regimenReceptor,
      codigoPostal: cpReceptor,
      usoCFDI,
    },
    factura: {
      folioFiscalUUID,
      serieYFolio,
      fechaEmision,
      lugarExpedicion,
      formaPago,
      metodoPago,
    },
    conceptos,
    totales: { subtotal, iva: ivaImporte, total, montoConLetra },
    sellos: { selloCFDI, selloSAT, cadenaOriginal },
  };
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  // Auth check
  const cookieName = getAdminSessionCookieName();
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;
  const session = verifyAdminSession(token);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('pdf');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No se recibió ningún archivo PDF.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await pdfParse(buffer, { max: 0 });
    const invoiceData = parseInvoice(parsed.text);

    return NextResponse.json({ success: true, data: invoiceData });
  } catch (err) {
    console.error('[extract-invoice]', err);
    return NextResponse.json(
      { error: 'No se pudo procesar el PDF. Verifica que sea un CFDI válido del SAT.' },
      { status: 500 }
    );
  }
}
