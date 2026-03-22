import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const QRCode = require('qrcode') as { toDataURL(text: string, opts?: { width?: number; margin?: number }): Promise<string> };
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

  const black = rgb(0, 0, 0);
  const gray  = rgb(0.42, 0.447, 0.502);  // #6B7280 — structural elements only

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
  const colCenter = (text: string, x0: number, x1: number, y: number, sz: number, opts?: DrawOpts) => {
    const w = font.widthOfTextAtSize(text, sz);
    draw(text, (x0 + x1) / 2 - w / 2, y, { size: sz, ...opts });
  };

  // ── IVA recalculation (always derive total from subtotal + iva) ──────────
  const subtotal = data.totales.subtotal;
  const iva      = data.totales.iva === 0 && subtotal > 0
    ? Math.round(subtotal * 0.16 * 100) / 100
    : data.totales.iva;
  const total    = Math.round((subtotal + iva) * 100) / 100;
  console.log('[generate-invoice] totals → subtotal:', subtotal, 'iva:', iva, 'total:', total);
  const montoConLetra = totalToLetras(total);

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
  page.drawRectangle({ x:  95, y: 935, width: 20, height: 20, color: rgb(0.20, 0.45, 0.70) });
  page.drawRectangle({ x: 115, y: 895, width: 20, height: 20, color: rgb(0.20, 0.45, 0.70) });
  page.drawRectangle({ x: 115, y: 935, width: 20, height: 20, color: rgb(0.55, 0.70, 0.85) });
  page.drawRectangle({ x: 115, y: 915, width: 20, height: 20, color: rgb(0.38, 0.58, 0.78) });
  page.drawRectangle({ x: 135, y: 935, width: 20, height: 20, color: rgb(0.70, 0.82, 0.92) });

  // TRIPOLI MEDIA logotype
  draw('TRIPOLI MEDIA', 188.2, 928.6, { size: 24, bold: true });

  // DATOS DEL EMISOR (static — always hardcoded, each line label+value combined)
  draw('DATOS DEL EMISOR',                                                        427.3, 962.5, { size: 10 });
  draw('RFC: MOEM000520NK2',                                                      427.3, 946.5, { size: 10 });
  draw('Nombre/Razón Social: Moisés Monraz Escoto',                               427.3, 932.5, { size: 10 });
  draw('Régimen Fiscal: 626 - RESICO',                                            427.3, 918.5, { size: 10 });
  draw('Dirección Fiscal: Av. de las Rosas 585 int. 2, Chapalita Oriente',        427.3, 904.5, { size: 10 });
  draw('45040, Zapopan, Jal.',                                                    427.3, 890.5, { size: 10 });

  // Header separator
  page.drawLine({ start: { x: 87.5, y: 850 }, end: { x: 727.5, y: 850 }, thickness: 0.5, color: black });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 2 — RECEPTOR + FACTURA  (y: 675–850)
  // ══════════════════════════════════════════════════════════════════════════

  // Vertical divider between columns
  page.drawLine({ start: { x: 407.5, y: 705 }, end: { x: 407.5, y: 820 }, thickness: 0.5, color: black });

  // Left column — DATOS DEL RECEPTOR (label+value as single strings)
  draw('DATOS DEL RECEPTOR',                                          95.0, 800.0, { size: 10 });
  draw('RFC: ' + receptor.rfc,                                        95.0, 784.0, { size: 10 });
  draw('Nombre/Razón Social: ' + receptor.nombre,                     95.0, 770.0, { size: 10 });
  draw('Régimen Fiscal: ' + receptor.regimenFiscal,                   95.0, 756.0, { size: 10 });
  draw('Código Postal: ' + receptor.codigoPostal,                     95.0, 742.0, { size: 10 });
  draw('Uso de CFDI: ' + receptor.usoCFDI,                            95.0, 728.0, { size: 10 });

  // Right column — DATOS DE LA FACTURA (label+value as single strings)
  draw('DATOS DE LA FACTURA',                                                      427.2, 807.0, { size: 10 });
  draw('Folio Fiscal: ' + factura.folioFiscalUUID,                                 427.2, 791.0, { size: 10 });
  draw('No. de serie del CSD: ' + (certSerial || serieYFolio || 'S/N'),            427.2, 777.0, { size: 10 });
  draw('Fecha y hora de emisión: ' + factura.fechaEmision,                         427.2, 763.0, { size: 10 });
  draw('Código Postal de expedición: ' + factura.lugarExpedicion,                  427.2, 749.0, { size: 10 });
  draw('Forma de pago: ' + factura.formaPago,                                      427.2, 735.0, { size: 10 });
  draw('Método de pago: ' + factura.metodoPago,                                    427.2, 721.0, { size: 10 });

  // Separator after receptor/factura
  page.drawLine({ start: { x: 87.5, y: 675 }, end: { x: 727.5, y: 675 }, thickness: 0.5, color: black });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 3 — CONCEPTOS  (y: 413.5–675)
  // ══════════════════════════════════════════════════════════════════════════

  draw('Conceptos', 98.6, 636.4, { size: 24 });

  // Table header borders (white background — no fill)
  page.drawLine({ start: { x: 87.5, y: 601.4 }, end: { x: 727.5, y: 601.4 }, thickness: 0.3, color: black });
  page.drawLine({ start: { x: 87.5, y: 552.5 }, end: { x: 727.5, y: 552.5 }, thickness: 0.3, color: black });

  // Column vertical dividers — only 3 (reference design)
  for (const divX of [407.5, 490, 609] as const) {
    page.drawLine({ start: { x: divX, y: 478.6 }, end: { x: divX, y: 601.4 }, thickness: 0.3, color: gray });
  }

  // Column headers — exact Illustrator positions, size=18
  draw('Clave SAT',   107.1, 579.7, { size: 18 });
  draw('Descripción', 221.3, 580.2, { size: 18 });
  draw('Unidad',      339.1, 580.4, { size: 18 });
  draw('Cant.',       428.3, 580.2, { size: 18 });
  draw('Precio',      524.3, 580.2, { size: 18 });
  draw('Total',       649.5, 580.2, { size: 18 });

  // Data rows (max 5) — exact Illustrator positions
  conceptos.slice(0, 5).forEach((c, i) => {
    const base = 529.1 - i * 30;
    draw(c.claveSAT,                                             120.9, base + 1.0,  { size: 12 });
    const descLines = wrapText(c.descripcion, 25);
    descLines.slice(0, 2).forEach((line, j) => draw(line,       243.7, base + 10.1 - j * 10, { size: 10 }));
    draw(c.unidad,                                               357.0, base + 0.4,  { size: 12 });
    draw(String(c.cantidad),                                     445.2, base + 0.2,  { size: 12 });
    draw(c.valorUnitario.toFixed(2),                             537.5, base,        { size: 12 });
    draw((c.importe ?? c.valorUnitario * c.cantidad).toFixed(2), 656.6, base,        { size: 12 });
  });

  // Conceptos bottom separators
  page.drawLine({ start: { x: 87.5, y: 503   }, end: { x: 727.5, y: 503   }, thickness: 0.5, color: black });
  page.drawLine({ start: { x: 87.5, y: 413.5 }, end: { x: 727.5, y: 413.5 }, thickness: 0.5, color: black });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 4 — TOTALES + CERT INFO  (y: 274.5–413.5)
  // ══════════════════════════════════════════════════════════════════════════

  // QR code — generated from folio fiscal UUID
  let qrDrawn = false;
  try {
    const qrDataUrl = await QRCode.toDataURL(factura.folioFiscalUUID, { width: 76, margin: 0 });
    const qrBase64  = qrDataUrl.replace(/^data:image\/png;base64,/, '');
    const qrImage   = await pdfDoc.embedPng(Buffer.from(qrBase64, 'base64'));
    page.drawImage(qrImage, { x: 97, y: 306, width: 76, height: 76 });
    qrDrawn = true;
  } catch { /* fall through */ }
  if (!qrDrawn) {
    page.drawRectangle({ x: 97, y: 306, width: 76, height: 76, borderColor: gray, borderWidth: 0.5 });
  }

  // Left block — certification data (label+value combined, size=7.5)
  draw('Fecha y hora de Certificación: ' + certDate,              182.5, 373.9, { size: 7.5 });
  draw('RFC del proveedor de certificación: ' + rfcPAC,           182.5, 353.9, { size: 7.5 });
  draw('No. de serie del certificado SAT: ' + certSerial,         182.5, 333.9, { size: 7.5 });
  draw('Este documento es una representación impresa de un CFDI', 182.3, 315.1, { size: 7.5 });

  // Right block — currency totals (size=12)
  draw('Subtotal :',                         547.2, 381.3, { size: 12 });
  draw('$ ' + subtotal.toFixed(2) + ' M.N.', 643.5, 381.3, { size: 12 });
  draw('+ I.V.A. 16% :',                     516.1, 352.8, { size: 12 });
  draw('$ ' + iva.toFixed(2)     + ' M.N.',  635.3, 352.8, { size: 12 });
  draw('Total :',                            564.3, 324.8, { size: 12, bold: true });
  draw('$ ' + total.toFixed(2)   + ' M.N.',  635.3, 324.3, { size: 12 });

  // Monto con letra
  draw(montoConLetra, 568.0, 293.6, { size: 7.5 });

  // Separator after totales
  page.drawLine({ start: { x: 87.5, y: 274.5 }, end: { x: 727.5, y: 274.5 }, thickness: 0.5, color: black });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 5 — SELLOS DIGITALES  (y: 164.5–274.5)
  // ══════════════════════════════════════════════════════════════════════════

  if (sellos.selloCFDI) {
    draw('Sello Digital del CFDI:', 97.5, 262.9, { size: 7.5 });
    (sellos.selloCFDI.match(/.{1,90}/g) ?? []).slice(0, 2).forEach((chunk, i) => {
      draw(chunk, 97.5, [251.6, 244.6][i], { size: 5 });
    });
  }
  if (sellos.selloSAT) {
    draw('Sello del SAT:', 97.5, 230.4, { size: 7.5 });
    (sellos.selloSAT.match(/.{1,90}/g) ?? []).slice(0, 2).forEach((chunk, i) => {
      draw(chunk, 97.5, [219.1, 209.1][i], { size: 5 });
    });
  }
  if (sellos.cadenaOriginal) {
    draw('Cadena Original del Complemento de Certificación Digital del SAT:', 97.5, 197.9, { size: 7.5 });
    const cadTrunc = sellos.cadenaOriginal.length > 220
      ? sellos.cadenaOriginal.slice(0, 219) + '…'
      : sellos.cadenaOriginal;
    (cadTrunc.match(/.{1,90}/g) ?? []).slice(0, 2).forEach((chunk, i) => {
      draw(chunk, 97.5, [186.6, 176.6][i], { size: 5 });
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 6 — FOOTER  (y: 0–164.5)
  // ══════════════════════════════════════════════════════════════════════════

  // Left — contact info (static)
  draw('www.tripoli.media',                                                    97.5, 138.6, { size: 9 });
  draw('+52 33 2817 5756',                                                     97.5, 124.6, { size: 9 });
  draw('contacto@tripoli.media',                                               97.5, 110.6, { size: 9 });
  draw('Av. de las Rosas 585 int. 2, Chapalita Oriente 45040, Zapopan, Jal.', 97.5,  96.6, { size: 9 });

  // Right — signature block
  page.drawLine({ start: { x: 487.5, y: 120 }, end: { x: 647.5, y: 120 }, thickness: 0.5, color: black });
  draw('Lic. Moisés Monraz Escoto', 494.5, 108.0, { size: 12 });
  draw('Dir. Tripoli Media',        529.1,  90.9, { size: 10 });

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
