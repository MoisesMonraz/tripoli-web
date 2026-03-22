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

// ─── Coordinate map (template: 815 × 1050 pt, origin = bottom-left) ──────────
//
//  Derived by scaling proportional estimates from A4 (595×842) to 815×1050:
//    x_scale = 815/595 = 1.370   y_scale = 1050/842 = 1.247
//
//  SECTION               Y range (from bottom)   Notes
//  ─────────────────────────────────────────────────────────────────────────
//  HEADER (pre-filled)   903 – 1050              DO NOT overlay
//  RECEPTOR / FACTURA    735 –  903              two columns
//  CONCEPTOS table       441 –  735
//  TOTALES               315 –  441
//  SELLOS                105 –  315
//  FOOTER (pre-filled)     0 –  105              DO NOT overlay
//
//  Fine-tune by adjusting values below and re-running scripts/test-invoice.mjs

// ─── Coordinate map (template: 815 × 1050 pt, origin = bottom-left) ──────────
//  Exact values measured from Documento_Factura.pdf with pdfplumber.
//  Labels marked "(pre-printed)" exist in the template and are not overlaid.
const C = {
  // Font sizes
  fs: {
    label: 7,
    value: 7,
    small: 7,
    sello: 5,
  },

  // ── DATOS DEL RECEPTOR — labels (pre-printed in template, reference only) ──
  rxLabel: {
    rfc:     { x:  95.0, y: 774.0 },
    nombre:  { x:  95.0, y: 760.0 },
    regimen: { x:  95.0, y: 746.0 },
    cp:      { x:  95.0, y: 732.0 },
    usoCFDI: { x:  95.0, y: 718.0 },
  },

  // ── DATOS DEL RECEPTOR — values ───────────────────────────────────────────
  rx: {
    rfc:     { x: 120.3, y: 774.0 },
    nombre:  { x: 201.9, y: 760.0 },
    regimen: { x: 170.2, y: 746.0 },
    cp:      { x: 164.4, y: 732.0 },
    usoCFDI: { x: 159.6, y: 718.0 },
  },

  // ── DATOS DE LA FACTURA — labels (pre-printed in template, reference only) ─
  fxLabel: {
    uuid:   { x: 427.2, y: 781.0 },
    serie:  { x: 427.2, y: 767.0 },
    fecha:  { x: 427.2, y: 753.0 },
    lugar:  { x: 427.2, y: 739.0 },
    forma:  { x: 427.2, y: 725.0 },
    metodo: { x: 427.2, y: 711.0 },
  },

  // ── DATOS DE LA FACTURA — values ──────────────────────────────────────────
  fx: {
    uuid:   { x: 483.9, y: 781.0 },
    serie:  { x: 530.8, y: 767.0 },
    fecha:  { x: 547.5, y: 753.0 },
    lugar:  { x: 564.7, y: 739.0 },
    forma:  { x: 504.2, y: 725.0 },
    metodo: { x: 509.9, y: 711.0 },
  },

  // ── CONCEPTOS TABLE ───────────────────────────────────────────────────────
  //   Columns: Clave SAT | Descripción | Unidad | Cant. | Precio | Total
  tbl: {
    clave:  120.9,
    desc:   238.9,
    unid:   357.0,
    cant:   445.2,
    prec:   537.5,
    tot:    656.6,
    row0y:  518.1,  // y baseline of first row (clave/unid/cant/prec/tot)
    descY0: 509.2,  // y baseline of first row description (slightly lower)
    rowH:    30,    // subtract per additional row
  },

  // ── TOTALES ───────────────────────────────────────────────────────────────
  tot: {
    subtotalVal: { x: 643.5, y: 369.3 },
    ivaVal:      { x: 635.3, y: 340.8 },
    totalVal:    { x: 635.3, y: 312.3 },
    letras:      { x: 568.0, y: 286.1 },
  },

  // ── FOOTER CERTIFICATION ──────────────────────────────────────────────────
  //   Labels pre-printed; only values are overlaid.
  cert: {
    fecha:  { x: 287.4, y: 366.4 },
    rfc:    { x: 305.9, y: 346.4 },
    serie:  { x: 296.1, y: 326.4 },
  },

  // ── SELLOS DIGITALES ──────────────────────────────────────────────────────
  sel: {
    cfdiLabel:   { x:  97.5, y: 255.4 },
    cfdiLine1:   { x:  97.5, y: 246.6 },
    cfdiLine2:   { x:  97.5, y: 239.6 },
    satLabel:    { x:  97.5, y: 222.9 },
    satLine1:    { x:  97.5, y: 214.1 },
    satLine2:    { x:  97.5, y: 204.1 },
    cadenaLabel: { x:  97.5, y: 190.4 },
    cadenaLine1: { x:  97.5, y: 181.6 },
    cadenaLine2: { x:  97.5, y: 171.6 },
  },
} as const;

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
  const int = Math.floor(total);
  const dec = Math.round((total - int) * 100);
  return `${numToWords(int)} PESOS ${String(dec).padStart(2, '0')}/100 M.N.`;
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
    if ((current + ' ' + w).trim().length <= maxChars) { current = (current + ' ' + w).trim(); }
    else { if (current) lines.push(current); current = w; }
  }
  if (current) lines.push(current);
  return lines;
}

// ─── Core overlay function ────────────────────────────────────────────────────

async function overlayInvoiceData(data: InvoiceData): Promise<Uint8Array> {
  // ── Load template ──────────────────────────────────────────────────────────
  const templatePath = path.join(process.cwd(), 'public', 'factura-template.pdf');
  const templateBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);

  // ── Register fontkit + embed font ──────────────────────────────────────────
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

  const page  = pdfDoc.getPages()[0];
  const black = rgb(0, 0, 0);
  const blue  = rgb(0.118, 0.227, 0.373);  // #1E3A5F
  const gray  = rgb(0.42, 0.447, 0.502);   // #6B7280

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

  // ── IVA recalculation ──────────────────────────────────────────────────────
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

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. DATOS DEL RECEPTOR
  // ═══════════════════════════════════════════════════════════════════════════
  draw(receptor.rfc,           C.rx.rfc.x,     C.rx.rfc.y,     { size: C.fs.value });
  draw(receptor.nombre,        C.rx.nombre.x,  C.rx.nombre.y,  { size: C.fs.value });
  draw(receptor.regimenFiscal, C.rx.regimen.x, C.rx.regimen.y, { size: C.fs.value });
  draw(receptor.codigoPostal,  C.rx.cp.x,      C.rx.cp.y,      { size: C.fs.value });
  draw(receptor.usoCFDI,       C.rx.usoCFDI.x, C.rx.usoCFDI.y, { size: C.fs.value });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. DATOS DE LA FACTURA
  // ═══════════════════════════════════════════════════════════════════════════
  draw(factura.folioFiscalUUID, C.fx.uuid.x,   C.fx.uuid.y,   { size: C.fs.value });
  draw(serieYFolio,             C.fx.serie.x,  C.fx.serie.y,  { size: C.fs.value });
  draw(factura.fechaEmision,    C.fx.fecha.x,  C.fx.fecha.y,  { size: C.fs.value });
  draw(factura.lugarExpedicion, C.fx.lugar.x,  C.fx.lugar.y,  { size: C.fs.value });
  draw(factura.formaPago,       C.fx.forma.x,  C.fx.forma.y,  { size: C.fs.value });
  draw(factura.metodoPago,      C.fx.metodo.x, C.fx.metodo.y, { size: C.fs.value });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. CONCEPTOS (up to 5 rows)
  // ═══════════════════════════════════════════════════════════════════════════
  conceptos.slice(0, 5).forEach((c, i) => {
    const yRow  = C.tbl.row0y  - i * C.tbl.rowH;
    const yDesc = C.tbl.descY0 - i * C.tbl.rowH;
    draw(c.claveSAT,                 C.tbl.clave, yRow,  { size: C.fs.label });
    draw(c.descripcion,              C.tbl.desc,  yDesc, { size: C.fs.label });
    draw(c.unidad,                   C.tbl.unid,  yRow,  { size: C.fs.label });
    draw(String(c.cantidad),         C.tbl.cant,  yRow,  { size: C.fs.label });
    draw(formatMXN(c.valorUnitario), C.tbl.prec,  yRow,  { size: C.fs.label });
    draw(formatMXN(c.importe),       C.tbl.tot,   yRow,  { size: C.fs.label });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. TOTALES
  // ═══════════════════════════════════════════════════════════════════════════
  draw(formatMXN(subtotal), C.tot.subtotalVal.x, C.tot.subtotalVal.y, { size: C.fs.value });
  draw(formatMXN(iva),      C.tot.ivaVal.x,      C.tot.ivaVal.y,      { size: C.fs.value });
  draw(formatMXN(total),    C.tot.totalVal.x,    C.tot.totalVal.y,    { size: C.fs.value });

  // Monto con letra — left-aligned at C.tot.letras
  const letraLines = wrapText(montoConLetra, 95);
  letraLines.slice(0, 2).forEach((line, i) => {
    draw(line, C.tot.letras.x, C.tot.letras.y - i * 9, { size: C.fs.value });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. FOOTER CERTIFICATION (labels are pre-printed; overlay values only)
  // ═══════════════════════════════════════════════════════════════════════════
  if (certDate)   draw(certDate,   C.cert.fecha.x, C.cert.fecha.y, { size: C.fs.small });
  if (rfcPAC)     draw(rfcPAC,     C.cert.rfc.x,   C.cert.rfc.y,   { size: C.fs.small });
  if (certSerial) draw(certSerial, C.cert.serie.x, C.cert.serie.y, { size: C.fs.small });

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. SELLOS DIGITALES
  // ═══════════════════════════════════════════════════════════════════════════
  if (sellos.selloCFDI) {
    draw('Sello Digital del CFDI:', C.sel.cfdiLabel.x, C.sel.cfdiLabel.y, { size: C.fs.label, color: blue });
    const cfdiLines = wrapText(sellos.selloCFDI, 140);
    if (cfdiLines[0]) draw(cfdiLines[0], C.sel.cfdiLine1.x, C.sel.cfdiLine1.y, { size: C.fs.sello });
    if (cfdiLines[1]) draw(cfdiLines[1], C.sel.cfdiLine2.x, C.sel.cfdiLine2.y, { size: C.fs.sello });
  }
  if (sellos.selloSAT) {
    draw('Sello Digital del SAT:', C.sel.satLabel.x, C.sel.satLabel.y, { size: C.fs.label, color: blue });
    const satLines = wrapText(sellos.selloSAT, 140);
    if (satLines[0]) draw(satLines[0], C.sel.satLine1.x, C.sel.satLine1.y, { size: C.fs.sello });
    if (satLines[1]) draw(satLines[1], C.sel.satLine2.x, C.sel.satLine2.y, { size: C.fs.sello });
  }
  if (sellos.cadenaOriginal) {
    draw('Cadena Original del Complemento de Certificación Digital del SAT:',
      C.sel.cadenaLabel.x, C.sel.cadenaLabel.y, { size: C.fs.label, color: blue });
    const cadenaLines = wrapText(sellos.cadenaOriginal, 140);
    if (cadenaLines[0]) draw(cadenaLines[0], C.sel.cadenaLine1.x, C.sel.cadenaLine1.y, { size: C.fs.sello });
    if (cadenaLines[1]) draw(cadenaLines[1], C.sel.cadenaLine2.x, C.sel.cadenaLine2.y, { size: C.fs.sello });
  }

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
