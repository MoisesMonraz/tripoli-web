import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { getAdminSessionCookieName, verifyAdminSession } from '../../../../lib/security/adminSession';
import type { InvoiceData } from '../../../../components/admin/FacturacionModule';

// ─── Coordinate map (A4: 595 × 842 pt, origin = bottom-left) ────────────────
//
//  SECTION               Y range (from bottom)   Notes
//  ─────────────────────────────────────────────────────────────────────────
//  HEADER (pre-filled)   724 – 842               DO NOT overlay
//  RECEPTOR / FACTURA    588 – 724               two columns
//  CONCEPTOS table       354 – 588
//  TOTALES               254 – 354
//  SELLOS                 84 – 254
//  FOOTER (pre-filled)     0 –  84               DO NOT overlay
//
//  All x/y values below are calibration estimates. To fine-tune:
//  change CALIBRATION constants and regenerate with the same invoice PDF.

const C = {
  // Font sizes
  fs: {
    label:   7,
    value:   8,
    small:   5.5,
    sello:   5,
    heading: 14,
  },

  // ── Receptor (left column, x: 38–277) ─────────────────────────────────────
  rx: {
    label:  38,   // where section label "DATOS DEL RECEPTOR" starts
    value: 130,   // where field values start (after "Dirección Fiscal:" label)
  },
  receptor: {
    title:      715,
    rfc:        700,
    nombre:     686,
    regimen:    672,
    direccion:  658,   // may overflow to next line
    usoCFDI:    638,
  },

  // ── Factura (right column, x: 303–557) ────────────────────────────────────
  fx: {
    label: 303,
    value: 400,
  },
  factura: {
    title:     715,
    uuid:      700,
    serie:     686,
    fecha:     672,
    lugar:     658,
    forma:     644,
    metodo:    630,
  },

  // ── Conceptos table ────────────────────────────────────────────────────────
  //   Columns:  Clave SAT | Descripción | Unidad | Cant. | Precio | Total
  tbl: {
    clave:  38,
    desc:  115,
    unid:  305,
    cant:  368,
    prec:  415,
    tot:   495,
    row0:  542,   // first data row y
    rowH:   17,   // row height (subtract per additional row)
  },

  // ── Totales ────────────────────────────────────────────────────────────────
  tot: {
    folioLabel:  334,
    folioValue:  319,
    certLabel:   304,
    certValue:   289,
    noteY:       274,
    subtotalLbl: 340, subtotalVal: 340,
    ivaLbl:      324, ivaVal:      324,
    totalLbl:    308, totalVal:    308,
    letrasY:     284,
    leftX:        93,
    midX:        420,
    rightX:      531,
  },

  // ── Sellos ─────────────────────────────────────────────────────────────────
  sel: {
    cfdiLabel:   243,
    cfdiValue:   231,
    satLabel:    210,
    satValue:    198,
    cadenaLabel: 177,
    cadenaValue: 165,
    x:            38,
  },
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMXN(n: number): string {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} M.N.`;
}

/** Number → Spanish words (0–999 999) */
function numToWords(n: number): string {
  const ones = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE',
    'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE',
    'DIECIOCHO', 'DIECINUEVE'];
  const tens = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
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

/** Parse certification date from cadena original: ||1.1|UUID|2026-03-19T13:56:27|... */
function extractCertDate(cadena: string): string {
  const m = cadena.match(/\|\|[\d.]+\|[0-9A-F-]{36}\|(\d{4}-\d{2}-\d{2}T[\d:]+)/i);
  return m ? m[1].replace('T', ' ') : '';
}

/** Wrap long text into lines that fit maxChars per line */
function wrapText(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    if ((current + ' ' + w).trim().length <= maxChars) {
      current = (current + ' ' + w).trim();
    } else {
      if (current) lines.push(current);
      current = w;
    }
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

  // ── Embed font ─────────────────────────────────────────────────────────────
  let font: Awaited<ReturnType<typeof pdfDoc.embedFont>>;
  let fontBold: Awaited<ReturnType<typeof pdfDoc.embedFont>>;
  try {
    const fontPath = path.join(process.cwd(), 'public', 'Shree714.ttc');
    const fontBytes = fs.readFileSync(fontPath);
    font     = await pdfDoc.embedFont(fontBytes, { subset: true });
    fontBold = font; // TTC single weight — use same font for all
    console.log('[generate-invoice] Shree714.ttc loaded successfully');
  } catch (fontErr) {
    console.warn('[generate-invoice] Shree714.ttc load failed, falling back to Helvetica:', fontErr);
    font     = await pdfDoc.embedFont(StandardFonts.Helvetica);
    fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  }

  const page  = pdfDoc.getPages()[0];
  const black = rgb(0, 0, 0);
  const blue  = rgb(0.118, 0.227, 0.373);  // #1E3A5F
  const gray  = rgb(0.42, 0.447, 0.502);   // #6B7280

  // Shorthand draw helpers
  const draw = (
    text: string,
    x: number,
    y: number,
    opts?: { size?: number; color?: typeof black; bold?: boolean; maxWidth?: number }
  ) => {
    const sz    = opts?.size  ?? C.fs.value;
    const color = opts?.color ?? black;
    const f     = opts?.bold  ? fontBold : font;
    // Clip text to maxWidth characters if specified
    const display = opts?.maxWidth
      ? (text.length > opts.maxWidth ? text.slice(0, opts.maxWidth - 1) + '…' : text)
      : text;
    page.drawText(display, { x, y, size: sz, font: f, color });
  };

  // ── IVA recalculation ──────────────────────────────────────────────────────
  const subtotal = data.totales.subtotal;
  let iva   = data.totales.iva;
  let total = data.totales.total;
  const ivaWasZero = iva === 0 && subtotal > 0;
  if (ivaWasZero) {
    iva   = Math.round(subtotal * 0.16 * 100) / 100;
    total = Math.round((subtotal + iva) * 100) / 100;
  }
  const montoConLetra = ivaWasZero
    ? totalToLetras(total)
    : (data.totales.montoConLetra || totalToLetras(total));

  const { emisor, receptor, factura, conceptos, sellos } = data;
  const serieYFolio = factura.serieYFolio?.trim() || 'S/N';
  const certDate    = extractCertDate(sellos.cadenaOriginal);

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. DATOS DEL RECEPTOR
  // ═══════════════════════════════════════════════════════════════════════════
  draw(receptor.rfc,            C.rx.value, C.receptor.rfc,      { maxWidth: 20 });
  draw(receptor.nombre,         C.rx.value, C.receptor.nombre,   { maxWidth: 38 });
  draw(receptor.regimenFiscal,  C.rx.value, C.receptor.regimen,  { maxWidth: 38 });
  // Dirección may be just CP — place it; long values will be clipped
  draw(receptor.codigoPostal,   C.rx.value, C.receptor.direccion,{ maxWidth: 38 });
  draw(receptor.usoCFDI,        C.rx.value, C.receptor.usoCFDI,  { maxWidth: 38 });

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
  // 3. CONCEPTOS (up to 5 rows — one per concepto)
  // ═══════════════════════════════════════════════════════════════════════════
  const maxRows = 5;
  conceptos.slice(0, maxRows).forEach((c, i) => {
    const y = C.tbl.row0 - i * C.tbl.rowH;
    draw(c.claveSAT,                        C.tbl.clave, y, { size: C.fs.label });
    draw(c.descripcion,                     C.tbl.desc,  y, { size: C.fs.label, maxWidth: 35 });
    draw(c.unidad,                          C.tbl.unid,  y, { size: C.fs.label, maxWidth: 10 });
    draw(String(c.cantidad),                C.tbl.cant,  y, { size: C.fs.label });
    draw(formatMXN(c.valorUnitario),        C.tbl.prec,  y, { size: C.fs.label });
    draw(formatMXN(c.importe),              C.tbl.tot,   y, { size: C.fs.label });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. TOTALES
  // ═══════════════════════════════════════════════════════════════════════════
  // Left side: folio + cert date + legal note
  draw('Folio Fiscal:',  C.tot.leftX,  C.tot.folioLabel, { size: C.fs.label, color: blue });
  draw(factura.folioFiscalUUID, C.tot.leftX, C.tot.folioValue, { size: C.fs.small, maxWidth: 55 });
  if (certDate) {
    draw('Fecha de Certificación:', C.tot.leftX, C.tot.certLabel, { size: C.fs.label, color: blue });
    draw(certDate, C.tot.leftX, C.tot.certValue, { size: C.fs.small });
  }
  draw('Este documento es una representación impresa de un CFDI', C.tot.leftX, C.tot.noteY, { size: 6, color: gray });

  // Right side: numeric totals — right-aligned at x=531
  const rightAlign = (text: string, x: number, y: number, sz: number = C.fs.value) => {
    const w = font.widthOfTextAtSize(text, sz);
    draw(text, x - w, y, { size: sz });
  };
  rightAlign(formatMXN(subtotal), C.tot.rightX, C.tot.subtotalVal);
  rightAlign(formatMXN(iva),      C.tot.rightX, C.tot.ivaVal);
  rightAlign(formatMXN(total),    C.tot.rightX, C.tot.totalVal, 9);

  // Monto con letra — centered below totals
  const letraLines = wrapText(montoConLetra, 88);
  letraLines.forEach((line, i) => {
    const lw = font.widthOfTextAtSize(line, C.fs.label);
    draw(line, (595 - lw) / 2, C.tot.letrasY - i * 9, { size: C.fs.label, color: gray });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. SELLOS DIGITALES
  // ═══════════════════════════════════════════════════════════════════════════
  if (sellos.selloCFDI) {
    draw('Sello Digital del CFDI:', C.sel.x, C.sel.cfdiLabel, { size: C.fs.label, color: blue });
    const cfdiLines = wrapText(sellos.selloCFDI, 130);
    cfdiLines.slice(0, 2).forEach((line, i) => {
      draw(line, C.sel.x, C.sel.cfdiValue - i * 8, { size: C.fs.sello });
    });
  }

  if (sellos.selloSAT) {
    draw('Sello Digital del SAT:', C.sel.x, C.sel.satLabel, { size: C.fs.label, color: blue });
    const satLines = wrapText(sellos.selloSAT, 130);
    satLines.slice(0, 2).forEach((line, i) => {
      draw(line, C.sel.x, C.sel.satValue - i * 8, { size: C.fs.sello });
    });
  }

  if (sellos.cadenaOriginal) {
    draw('Cadena Original del Complemento de Certificación Digital del SAT:', C.sel.x, C.sel.cadenaLabel, { size: C.fs.label, color: blue });
    const cadLines = wrapText(sellos.cadenaOriginal, 130);
    cadLines.slice(0, 2).forEach((line, i) => {
      draw(line, C.sel.x, C.sel.cadenaValue - i * 8, { size: C.fs.sello });
    });
  }

  // ── Serialize ──────────────────────────────────────────────────────────────
  return pdfDoc.save();
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const cookieName = getAdminSessionCookieName();
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;
  const session = verifyAdminSession(token);
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
