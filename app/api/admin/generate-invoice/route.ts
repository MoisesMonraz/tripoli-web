import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { getAdminSessionCookieName, verifyAdminSession } from '../../../../lib/security/adminSession';
import type { InvoiceData } from '../../../../components/admin/FacturacionModule';

// ─── TTC → TTF extraction ─────────────────────────────────────────────────────
// TrueType Collection files embed multiple TTFs sharing table data at absolute
// offsets. pdf-lib/fontkit cannot handle TTC directly; we extract the first
// font and rebuild a standalone TTF with corrected (relative) offsets.
function extractFirstTTFFromTTC(buf: Buffer): Buffer {
  const tag = buf.slice(0, 4).toString('binary');
  if (tag !== 'ttcf') return buf;                          // not a TTC — pass through

  const firstOffset = buf.readUInt32BE(12);                // offset to 1st OffsetTable
  const numTables   = buf.readUInt16BE(firstOffset + 4);

  // Read table directory entries (each is 16 bytes)
  const tables: { tag: string; checksum: number; offset: number; length: number }[] = [];
  for (let i = 0; i < numTables; i++) {
    const base = firstOffset + 12 + i * 16;
    tables.push({
      tag:      buf.slice(base, base + 4).toString('binary'),
      checksum: buf.readUInt32BE(base + 4),
      offset:   buf.readUInt32BE(base + 8),
      length:   buf.readUInt32BE(base + 12),
    });
  }

  // Layout: OffsetTable(12) + TableDirectory(numTables×16) + table data (4-byte aligned)
  const headerSize = 12 + numTables * 16;
  let dataSize = 0;
  for (const t of tables) dataSize += Math.ceil(t.length / 4) * 4;

  const out = Buffer.alloc(headerSize + dataSize);
  buf.copy(out, 0, firstOffset, firstOffset + 12);         // copy OffsetTable header

  let cursor = headerSize;
  for (let i = 0; i < tables.length; i++) {
    const t   = tables[i];
    const dir = 12 + i * 16;
    out.write(t.tag, dir, 'binary');
    out.writeUInt32BE(t.checksum, dir + 4);
    out.writeUInt32BE(cursor,     dir + 8);                // patched offset
    out.writeUInt32BE(t.length,   dir + 12);
    buf.copy(out, cursor, t.offset, t.offset + t.length);  // copy table data
    cursor += Math.ceil(t.length / 4) * 4;
  }
  return out;
}

// ─── Default font sizes (referenced by draw / rightAlign helpers) ─────────────
const C = { fs: { label: 7, value: 7, small: 7, sello: 5 } } as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMXN(n: number): string {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} M.N.`;
}

function numToWords(n: number): string {
  const ones = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE',
    'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE',
    'DIECIOCHO', 'DIECINUEVE'];
  const tens  = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const hunds = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];
  if (n === 0) return 'CERO';
  if (n === 100) return 'CIEN';
  let r = '';
  if (n >= 1000) { const t = Math.floor(n / 1000); r += t === 1 ? 'MIL ' : numToWords(t) + ' MIL '; n %= 1000; }
  if (n >= 100)  { r += hunds[Math.floor(n / 100)] + ' '; n %= 100; }
  if (n >= 20)   { r += tens[Math.floor(n / 10)]; if (n % 10) r += ' Y ' + ones[n % 10]; r += ' '; }
  else if (n > 0){ r += ones[n] + ' '; }
  return r.trim();
}

function totalToLetras(total: number): string {
  const int    = Math.floor(total);
  const dec    = Math.round((total - int) * 100);
  const decStr = String(dec).padStart(2, '0');
  if (int === 1) return `UN PESO ${decStr}/100 M.N.`;
  return `${numToWords(int)} PESOS ${decStr}/100 M.N.`;
}

function extractCertDate(cadena: string): string {
  const m = cadena.match(/\|\|[\d.]+\|[0-9A-F-]{36}\|(\d{4}-\d{2}-\d{2}T[\d:]+)/i);
  return m ? m[1].replace('T', ' ') : '';
}

function wrapText(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    let word = w;
    // Break oversized words character-by-character (e.g. base64 sello with no spaces)
    while (word.length > maxChars) {
      if (current) { lines.push(current); current = ''; }
      lines.push(word.slice(0, maxChars));
      word = word.slice(maxChars);
    }
    if (!word) continue;
    const candidate = current ? current + ' ' + word : word;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// ─── Core overlay function ────────────────────────────────────────────────────

async function overlayInvoiceData(data: InvoiceData): Promise<Uint8Array> {
  // ── Create document from scratch ─────────────────────────────────────────
  const pdfDoc = await PDFDocument.create();
  const page   = pdfDoc.addPage([815, 1050]);

  // ── Register fontkit + embed font ────────────────────────────────────────
  pdfDoc.registerFontkit(fontkit);

  let font: Awaited<ReturnType<typeof pdfDoc.embedFont>>;
  let fontBold: Awaited<ReturnType<typeof pdfDoc.embedFont>>;
  try {
    const fontPath  = path.join(process.cwd(), 'public', 'Shree714.ttc');
    const rawBytes  = fs.readFileSync(fontPath);
    const fontBytes = extractFirstTTFFromTTC(rawBytes); // extract TTF from TTC
    font     = await pdfDoc.embedFont(fontBytes);
    fontBold = font;
    console.log('[generate-invoice] ✓ Shree714.ttc embedded');
  } catch (fontErr) {
    console.warn('[generate-invoice] ⚠ Font fallback to Helvetica:', fontErr);
    font     = await pdfDoc.embedFont(StandardFonts.Helvetica);
    fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  }

  const black     = rgb(0, 0, 0);
  const blue      = rgb(0.118, 0.227, 0.373);  // #1E3A5F
  const gray      = rgb(0.42,  0.447, 0.502);  // #6B7280
  const red       = rgb(0.85,  0.11,  0.11);   // #D91C1C
  const lightgray = rgb(0.9,   0.9,   0.9);

  type DrawOpts = { size?: number; color?: ReturnType<typeof rgb>; bold?: boolean; maxWidth?: number };
  const draw = (text: string, x: number, y: number, opts?: DrawOpts) => {
    const sz      = opts?.size  ?? C.fs.value;
    const color   = opts?.color ?? black;
    const f       = opts?.bold  ? fontBold : font;
    const display = opts?.maxWidth
      ? (text.length > opts.maxWidth ? text.slice(0, opts.maxWidth - 1) + '…' : text)
      : text;
    page.drawText(display, { x, y, size: sz, font: f, color });
  };

  const rightAlign = (text: string, x: number, y: number, sz: number = C.fs.value) => {
    const w = font.widthOfTextAtSize(text, sz);
    draw(text, x - w, y, { size: sz });
  };

  // Helper: draw text centered within a column
  const colCenter = (text: string, x0: number, x1: number, y: number, sz: number) => {
    const w = font.widthOfTextAtSize(text, sz);
    draw(text, (x0 + x1) / 2 - w / 2, y, { size: sz });
  };

  // ── IVA recalculation ────────────────────────────────────────────────────
  const subtotal    = data.totales.subtotal;
  let iva           = data.totales.iva;
  let total         = data.totales.total;
  const ivaWasZero  = iva === 0 && subtotal > 0;
  if (ivaWasZero) {
    iva   = Math.round(subtotal * 0.16 * 100) / 100;
    total = Math.round((subtotal + iva)  * 100) / 100;
  }
  const montoConLetra = ivaWasZero
    ? totalToLetras(total)
    : (data.totales.montoConLetra || totalToLetras(total));

  const { receptor, factura, conceptos, sellos } = data;
  const serieYFolio = factura.serieYFolio?.trim() || 'S/N';
  const certDate    = extractCertDate(sellos.cadenaOriginal);

  // Parse RFC PAC and cert serial from cadena original
  // Format: ||1.1|UUID|DATE|RFC_PAC|SELLO_CFDI|CERT_SERIAL||
  const cadParts   = sellos.cadenaOriginal.split('|').filter(Boolean);
  const rfcPAC     = cadParts[3] || '';
  const certSerial = cadParts[5] || '';

  // ──────────────────────────────────────────────────────────────────────────
  // OUTER BORDER
  // ──────────────────────────────────────────────────────────────────────────
  page.drawRectangle({ x: 50.5, y: 50.5, width: 714, height: 949, borderColor: black, borderWidth: 0.5 });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 1 — HEADER  (y: 850–1050)
  // ══════════════════════════════════════════════════════════════════════════

  // Logo: geometric pixel blocks
  page.drawRectangle({ x:  95, y: 935, width: 20, height: 20, color: red });
  page.drawRectangle({ x: 115, y: 895, width: 20, height: 20, color: red });
  page.drawRectangle({ x: 115, y: 935, width: 20, height: 20, color: rgb(0.5,  0.05, 0.05) });
  page.drawRectangle({ x: 115, y: 915, width: 20, height: 20, color: rgb(0.35, 0.05, 0.05) });
  page.drawRectangle({ x: 135, y: 935, width: 20, height: 20, color: rgb(0.25, 0.05, 0.05) });

  // TRIPOLI MEDIA logotype
  draw('TRIPOLI MEDIA', 188, 921, { size: 20, color: red, bold: true });

  // DATOS DEL EMISOR (static — always hardcoded)
  draw('DATOS DEL EMISOR',                                    427, 962, { size: 7, color: blue, bold: true });
  draw('RFC:',                                                427, 946, { size: 7, color: blue });
  draw('MOEM000520NK2',                                       452, 946, { size: 7 });
  draw('Nombre/Razón Social:',                                427, 932, { size: 7, color: blue });
  draw('Moisés Monraz Escoto',                                534, 932, { size: 7 });
  draw('Régimen Fiscal:',                                     427, 918, { size: 7, color: blue });
  draw('626 - RESICO',                                        502, 918, { size: 7 });
  draw('Dirección Fiscal:',                                   427, 904, { size: 7, color: blue });
  draw('Av. de las Rosas 585 int. 2, Chapalita Oriente',      504, 904, { size: 7 });
  draw('45040, Zapopan, Jal.',                                427, 890, { size: 7 });

  // Header separator
  page.drawLine({ start: { x: 87.5, y: 850 }, end: { x: 727.5, y: 850 }, thickness: 0.5, color: black });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 2 — RECEPTOR + FACTURA  (y: 675–850)
  // ══════════════════════════════════════════════════════════════════════════

  // Vertical divider between columns
  page.drawLine({ start: { x: 407.5, y: 705 }, end: { x: 407.5, y: 820 }, thickness: 0.5, color: black });

  // Left column — DATOS DEL RECEPTOR
  draw('DATOS DEL RECEPTOR',    95, 810, { size: 7, color: blue, bold: true });
  draw('RFC:',                  95, 774, { size: 7, color: blue });
  draw(receptor.rfc,           120, 774, { size: 7 });
  draw('Nombre/Razón Social:',  95, 760, { size: 7, color: blue });
  draw(receptor.nombre,        202, 760, { size: 7, maxWidth: 38 });
  draw('Régimen Fiscal:',       95, 746, { size: 7, color: blue });
  draw(receptor.regimenFiscal, 170, 746, { size: 7, maxWidth: 38 });
  draw('Código Postal:',        95, 732, { size: 7, color: blue });
  draw(receptor.codigoPostal,  164, 732, { size: 7 });
  draw('Uso de CFDI:',          95, 718, { size: 7, color: blue });
  draw(receptor.usoCFDI,       160, 718, { size: 7, maxWidth: 38 });

  // Right column — DATOS DE LA FACTURA
  draw('DATOS DE LA FACTURA',          427, 810, { size: 7, color: blue, bold: true });
  draw('Folio Fiscal:',                427, 781, { size: 7, color: blue });
  draw(factura.folioFiscalUUID,        484, 781, { size: 6.5 });
  draw('No. de serie del CSD:',        427, 767, { size: 7, color: blue });
  draw(certSerial || serieYFolio || 'S/N', 531, 767, { size: 6.5 });
  draw('Fecha y hora de emisión:',     427, 753, { size: 7, color: blue });
  draw(factura.fechaEmision,           548, 753, { size: 7 });
  draw('Código Postal de expedición:', 427, 739, { size: 7, color: blue });
  draw(factura.lugarExpedicion,        565, 739, { size: 7 });
  draw('Forma de pago:',               427, 725, { size: 7, color: blue });
  draw(factura.formaPago,              504, 725, { size: 7 });
  draw('Método de pago:',              427, 711, { size: 7, color: blue });
  draw(factura.metodoPago,             510, 711, { size: 7 });

  // Separator after receptor/factura
  page.drawLine({ start: { x: 87.5, y: 675 }, end: { x: 727.5, y: 675 }, thickness: 0.5, color: black });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 3 — CONCEPTOS  (y: 413.5–675)
  // ══════════════════════════════════════════════════════════════════════════

  draw('Conceptos', 98, 637, { size: 18 });

  // Table header background + borders
  page.drawRectangle({ x: 87.5, y: 552.5, width: 640, height: 48.9, color: lightgray });
  page.drawLine({ start: { x: 87.5, y: 601.4 }, end: { x: 727.5, y: 601.4 }, thickness: 0.3, color: black });
  page.drawLine({ start: { x: 87.5, y: 552.5 }, end: { x: 727.5, y: 552.5 }, thickness: 0.3, color: black });

  // Column vertical dividers (header + data rows)
  for (const divX of [210, 327.5, 407.5, 490, 609] as const) {
    page.drawLine({ start: { x: divX, y: 478.6 }, end: { x: divX, y: 601.4 }, thickness: 0.3, color: gray });
  }

  // Column headers
  colCenter('Clave SAT',    87.5, 210,   562, 8);
  colCenter('Descripción',  210,  327.5, 562, 8);
  colCenter('Unidad',       327.5, 407.5, 562, 8);
  colCenter('Cant.',        407.5, 490,   562, 8);
  colCenter('Precio',       490,  609,   562, 8);
  colCenter('Total',        609,  727.5, 562, 8);

  // Data rows (max 5)
  conceptos.slice(0, 5).forEach((c, i) => {
    const yRow = 517 - i * 30;
    colCenter(c.claveSAT,                    87.5, 210,   yRow, 7);
    // Description: left-aligned at x=215, wrap if needed
    const descLines = wrapText(c.descripcion, 20);
    descLines.slice(0, 2).forEach((line, j) => draw(line, 215, yRow - j * 10, { size: 7 }));
    colCenter(c.unidad,                      327.5, 407.5, yRow, 7);
    colCenter(String(c.cantidad),            407.5, 490,   yRow, 7);
    rightAlign(formatMXN(c.valorUnitario),   600, yRow, 7);
    rightAlign(formatMXN(c.importe ?? c.valorUnitario * c.cantidad), 720, yRow, 7);
  });

  // Conceptos bottom separators
  page.drawLine({ start: { x: 87.5, y: 503   }, end: { x: 727.5, y: 503   }, thickness: 0.5, color: black });
  page.drawLine({ start: { x: 87.5, y: 413.5 }, end: { x: 727.5, y: 413.5 }, thickness: 0.5, color: black });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 4 — TOTALES + CERT INFO  (y: 274.5–413.5)
  // ══════════════════════════════════════════════════════════════════════════

  // QR code placeholder (empty rect — generation out of scope)
  page.drawRectangle({ x: 97, y: 306, width: 76, height: 76, borderColor: gray, borderWidth: 0.5 });

  // Left block — certification data
  draw('Fecha y hora de Certificación:',      182, 366, { size: 7, color: blue });
  draw(certDate,                              287, 366, { size: 7 });
  draw('RFC del proveedor de certificación:', 182, 346, { size: 7, color: blue });
  draw(rfcPAC,                               306, 346, { size: 7 });
  draw('No. de serie del certificado SAT:',   182, 326, { size: 7, color: blue });
  draw(certSerial,                            296, 326, { size: 7 });
  draw('Este documento es una representación impresa de un CFDI', 182, 306, { size: 6, color: gray });

  // Right block — currency totals
  draw('Subtotal :',     548, 369, { size: 8 });
  rightAlign(formatMXN(subtotal), 720, 369, 8);
  draw('+ I.V.A. 16% :', 516, 341, { size: 8 });
  rightAlign(formatMXN(iva),      720, 341, 8);
  draw('Total :',        564, 313, { size: 9, bold: true });
  rightAlign(formatMXN(total),    720, 313, 9);

  // Monto con letra — centered between x=490 and x=727
  const letraLines = wrapText(montoConLetra, 95);
  letraLines.slice(0, 2).forEach((line, i) => {
    const lw = font.widthOfTextAtSize(line, 7);
    draw(line, (490 + 727) / 2 - lw / 2, 286 - i * 9, { size: 7, color: gray });
  });

  // Separator after totales
  page.drawLine({ start: { x: 87.5, y: 274.5 }, end: { x: 727.5, y: 274.5 }, thickness: 0.5, color: black });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 5 — SELLOS DIGITALES  (y: 164.5–274.5)
  // ══════════════════════════════════════════════════════════════════════════

  if (sellos.selloCFDI) {
    draw('Sello Digital del CFDI:', 97.5, 255, { size: 7, color: blue });
    wrapText(sellos.selloCFDI, 95).slice(0, 3).forEach((line, i) => {
      draw(line, 97.5, 246 - i * 7, { size: 5 });
    });
  }
  if (sellos.selloSAT) {
    draw('Sello del SAT:', 97.5, 223, { size: 7, color: blue });
    wrapText(sellos.selloSAT, 95).slice(0, 3).forEach((line, i) => {
      draw(line, 97.5, 214 - i * 7, { size: 5 });
    });
  }
  if (sellos.cadenaOriginal) {
    draw('Cadena Original del Complemento de Certificación Digital del SAT:', 97.5, 190, { size: 7, color: blue });
    wrapText(sellos.cadenaOriginal, 80).slice(0, 3).forEach((line, i) => {
      draw(line, 97.5, 181 - i * 7, { size: 5 });
    });
  }

  // Separator after sellos
  page.drawLine({ start: { x: 87.5, y: 164.5 }, end: { x: 727.5, y: 164.5 }, thickness: 0.5, color: black });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 6 — FOOTER  (y: 0–164.5)
  // ══════════════════════════════════════════════════════════════════════════

  // Left — contact info (static)
  draw('www.tripoli.media',                                                    97, 139, { size: 8 });
  draw('+52 33 2817 5756',                                                     97, 125, { size: 8 });
  draw('contacto@tripoli.media',                                               97, 111, { size: 8 });
  draw('Av. de las Rosas 585 int. 2, Chapalita Oriente 45040, Zapopan, Jal.', 97,  97, { size: 7 });

  // Right — signature block
  page.drawLine({ start: { x: 487.5, y: 120 }, end: { x: 647.5, y: 120 }, thickness: 0.5, color: black });
  draw('Lic. Moisés Monraz Escoto', 494, 108, { size: 8 });
  draw('Dir. Tripoli Media',        529,  96, { size: 7, color: gray });

  return pdfDoc.save();
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const cookieName  = getAdminSessionCookieName();
  const cookieStore = await cookies();
  const token       = cookieStore.get(cookieName)?.value;
  const session     = verifyAdminSession(token);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  try {
    const body = await request.json() as { data: InvoiceData };
    const { data } = body;

    if (!data) {
      return NextResponse.json({ error: 'No se recibieron datos de factura.' }, { status: 400 });
    }

    const pdfBytes = await overlayInvoiceData(data);
    const uuid     = data.factura?.folioFiscalUUID?.slice(0, 8) || 'factura';
    const filename = `factura-tripoli-${uuid}.pdf`;

    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length':      String(pdfBytes.length),
      },
    });
  } catch (err) {
    console.error('[generate-invoice]', err);
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json(
      { error: `No se pudo generar el PDF: ${message}` },
      { status: 500 }
    );
  }
}
