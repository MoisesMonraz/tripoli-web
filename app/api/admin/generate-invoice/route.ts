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

const C = {
  // Font sizes
  fs: {
    label:   7,
    value:   8,
    small:   5.5,
    sello:   5,
  },

  // ── Receptor (left column) ─────────────────────────────────────────────────
  rx: {
    value: 178,   // x where field values start (after longest label)
  },
  receptor: {
    rfc:      873,
    nombre:   855,
    regimen:  838,
    direccion:820,
    usoCFDI:  795,
  },

  // ── Factura (right column) ─────────────────────────────────────────────────
  fx: {
    value: 548,   // x where field values start
  },
  factura: {
    uuid:   873,
    serie:  855,
    fecha:  838,
    lugar:  820,
    forma:  803,
    metodo: 786,
  },

  // ── Conceptos table ────────────────────────────────────────────────────────
  //   Columns: Clave SAT | Descripción | Unidad | Cant. | Precio | Total
  tbl: {
    clave:  52,
    desc:  158,
    unid:  418,
    cant:  504,
    prec:  568,
    tot:   678,
    row0:  676,   // first data row y
    rowH:   21,   // row height (subtract per additional row)
  },

  // ── Totales ────────────────────────────────────────────────────────────────
  tot: {
    folioLabel:  416,
    folioValue:  398,
    certLabel:   379,
    certValue:   360,
    noteY:       342,
    subtotalVal: 424,
    ivaVal:      404,
    totalVal:    384,
    letrasY:     354,
    leftX:       127,
    rightX:      727,
  },

  // ── Sellos ─────────────────────────────────────────────────────────────────
  sel: {
    cfdiLabel:   303,
    cfdiValue:   288,
    satLabel:    262,
    satValue:    247,
    cadenaLabel: 221,
    cadenaValue: 206,
    x:            52,
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

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. DATOS DEL RECEPTOR
  // ═══════════════════════════════════════════════════════════════════════════
  draw(receptor.rfc,            C.rx.value, C.receptor.rfc,       { maxWidth: 20 });
  draw(receptor.nombre,         C.rx.value, C.receptor.nombre,    { maxWidth: 38 });
  draw(receptor.regimenFiscal,  C.rx.value, C.receptor.regimen,   { maxWidth: 38 });
  draw(receptor.codigoPostal,   C.rx.value, C.receptor.direccion, { maxWidth: 38 });
  draw(receptor.usoCFDI,        C.rx.value, C.receptor.usoCFDI,   { maxWidth: 38 });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. DATOS DE LA FACTURA
  // ═══════════════════════════════════════════════════════════════════════════
  draw(factura.folioFiscalUUID, C.fx.value, C.factura.uuid,   { size: C.fs.small, maxWidth: 48 });
  draw(serieYFolio,             C.fx.value, C.factura.serie,  { maxWidth: 20 });
  draw(factura.fechaEmision,    C.fx.value, C.factura.fecha,  { maxWidth: 30 });
  draw(factura.lugarExpedicion, C.fx.value, C.factura.lugar,  { maxWidth: 25 });
  draw(factura.formaPago,       C.fx.value, C.factura.forma,  { maxWidth: 30 });
  draw(factura.metodoPago,      C.fx.value, C.factura.metodo, { maxWidth: 35 });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. CONCEPTOS (up to 5 rows)
  // ═══════════════════════════════════════════════════════════════════════════
  conceptos.slice(0, 5).forEach((c, i) => {
    const y = C.tbl.row0 - i * C.tbl.rowH;
    draw(c.claveSAT,                 C.tbl.clave, y, { size: C.fs.label });
    draw(c.descripcion,              C.tbl.desc,  y, { size: C.fs.label, maxWidth: 35 });
    draw(c.unidad,                   C.tbl.unid,  y, { size: C.fs.label, maxWidth: 10 });
    draw(String(c.cantidad),         C.tbl.cant,  y, { size: C.fs.label });
    draw(formatMXN(c.valorUnitario), C.tbl.prec,  y, { size: C.fs.label });
    draw(formatMXN(c.importe),       C.tbl.tot,   y, { size: C.fs.label });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. TOTALES
  // ═══════════════════════════════════════════════════════════════════════════
  // Left: folio + cert date + legal note
  draw('Folio Fiscal:',  C.tot.leftX, C.tot.folioLabel, { size: C.fs.label, color: blue });
  draw(factura.folioFiscalUUID, C.tot.leftX, C.tot.folioValue, { size: C.fs.small, maxWidth: 55 });
  if (certDate) {
    draw('Fecha de Certificación:', C.tot.leftX, C.tot.certLabel, { size: C.fs.label, color: blue });
    draw(certDate, C.tot.leftX, C.tot.certValue, { size: C.fs.small });
  }
  draw('Este documento es una representación impresa de un CFDI',
    C.tot.leftX, C.tot.noteY, { size: 6, color: gray });

  // Right: currency values (right-aligned)
  rightAlign(formatMXN(subtotal), C.tot.rightX, C.tot.subtotalVal);
  rightAlign(formatMXN(iva),      C.tot.rightX, C.tot.ivaVal);
  rightAlign(formatMXN(total),    C.tot.rightX, C.tot.totalVal, 9);

  // Monto con letra — centered
  const pageWidth = page.getWidth();
  const letraLines = wrapText(montoConLetra, 95);
  letraLines.forEach((line, i) => {
    const lw = font.widthOfTextAtSize(line, C.fs.label);
    draw(line, (pageWidth - lw) / 2, C.tot.letrasY - i * 9, { size: C.fs.label, color: gray });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. SELLOS DIGITALES
  // ═══════════════════════════════════════════════════════════════════════════
  if (sellos.selloCFDI) {
    draw('Sello Digital del CFDI:', C.sel.x, C.sel.cfdiLabel, { size: C.fs.label, color: blue });
    wrapText(sellos.selloCFDI, 140).slice(0, 2).forEach((line, i) => {
      draw(line, C.sel.x, C.sel.cfdiValue - i * 8, { size: C.fs.sello });
    });
  }
  if (sellos.selloSAT) {
    draw('Sello Digital del SAT:', C.sel.x, C.sel.satLabel, { size: C.fs.label, color: blue });
    wrapText(sellos.selloSAT, 140).slice(0, 2).forEach((line, i) => {
      draw(line, C.sel.x, C.sel.satValue - i * 8, { size: C.fs.sello });
    });
  }
  if (sellos.cadenaOriginal) {
    draw('Cadena Original del Complemento de Certificación Digital del SAT:',
      C.sel.x, C.sel.cadenaLabel, { size: C.fs.label, color: blue });
    wrapText(sellos.cadenaOriginal, 140).slice(0, 2).forEach((line, i) => {
      draw(line, C.sel.x, C.sel.cadenaValue - i * 8, { size: C.fs.sello });
    });
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
