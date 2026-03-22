// Run: node scripts/test-invoice.mjs
// Generates test-invoice-output.pdf using the same logic as the route (from scratch)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

// Extract first TTF from a TrueType Collection (TTC)
function extractFirstTTFFromTTC(buf) {
  const tag = buf.slice(0, 4).toString('binary');
  if (tag !== 'ttcf') return buf;
  const firstOffset = buf.readUInt32BE(12);
  const numTables   = buf.readUInt16BE(firstOffset + 4);
  const tables = [];
  for (let i = 0; i < numTables; i++) {
    const base = firstOffset + 12 + i * 16;
    tables.push({ tag: buf.slice(base, base+4).toString('binary'), checksum: buf.readUInt32BE(base+4), offset: buf.readUInt32BE(base+8), length: buf.readUInt32BE(base+12) });
  }
  const headerSize = 12 + numTables * 16;
  let dataSize = 0;
  for (const t of tables) dataSize += Math.ceil(t.length/4)*4;
  const out = Buffer.alloc(headerSize + dataSize);
  buf.copy(out, 0, firstOffset, firstOffset + 12);
  let cursor = headerSize;
  for (let i = 0; i < tables.length; i++) {
    const t = tables[i]; const dir = 12 + i*16;
    out.write(t.tag, dir, 'binary');
    out.writeUInt32BE(t.checksum, dir+4); out.writeUInt32BE(cursor, dir+8); out.writeUInt32BE(t.length, dir+12);
    buf.copy(out, cursor, t.offset, t.offset + t.length);
    cursor += Math.ceil(t.length/4)*4;
  }
  return out;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// ─── Sample invoice data (mirrors real SAT extraction output) ────────────────
const data = {
  receptor: {
    rfc: 'AERJ010214Q9A',
    nombre: 'JUAN IGNACIO ARMENTA REYNOSO',
    regimenFiscal: 'Régimen Simplificado de Confianza',
    codigoPostal: '44600',
    usoCFDI: 'Gastos en general.',
  },
  factura: {
    folioFiscalUUID: '336699AF-CBD5-49CB-9CB0-C1FA33516F6D',
    serieYFolio: '',
    fechaEmision: '2026-03-19 13:49:23',
    lugarExpedicion: '45040',
    formaPago: 'Efectivo',
    metodoPago: 'Pago en una sola exhibición',
  },
  conceptos: [
    {
      claveSAT: '81111806',
      descripcion: 'Servicio de traducción e interpretación',
      cantidad: 1,
      unidad: 'E48',
      valorUnitario: 1.00,
      importe: 1.00,
    },
  ],
  totales: {
    subtotal: 1.00,
    iva: 0,       // intentionally 0 to test IVA recalculation
    total: 1.00,
    montoConLetra: '',
  },
  sellos: {
    selloCFDI: 'M8OybUfDc9Dfz1qv5VnbBvb4N/N81zcduVaBAicRjIpqdsxSPTqR3h+W2xFqu1Ex3NwY4Y+Xqg/7ll1FnimqbWZRy4UO3uZPR1HNisgVVm6+vzCfi4aNZAHMJW/qpdHMZSTOGrKsZjrafH0f9lhp7KhAkXWrhK10l/XfE5dZIbGnEdIzLsPys3Pr83kwJQge06D4KhPlf6FcIXYmkkLiFxPrN0XkrWRbnR1c/eiHCa3uWSGu4ucRT+7LuxFA9Ib4iC/ltuLmqGWIC+ET0etyNvGCN3yxp7I50orjp/Iczh1u22mD2WTGt4kfFyNZTdw3fV5+JcfAIAiGZSe4CaUTGA==',
    selloSAT: 'A+Y1hrJvES2B8pwEhOSJxMAafzQflGD5AYxw6pXIpYtyQKLIkCw1hgEXsY6Gl0wUUbuSSBkxrbsFcb7BXjFYBjs56VYHqnFdYFgpkaISUGl1QBPplyk8AMBwI2fOkqFx8kOUOSRx5uzH46GNH3JhEVpRItOiKMTLyO7fLI1YXg98iNb0sADy48lpD42osTs+31ArUcSWCqh4nyC4HhM7H1XF+jBauQM0Xr3ZXwpp3NueQRIh6Yxs/Fx/cGeC+dNy/jYFDN2PHcRtz3yP9LkRWRNR00QYHQ0azTi/c4xzF+6BHYDqkUe/4HhjTEi1sVcn20P1zrC1Bxr2rMnaWJI6Ng==',
    cadenaOriginal: '||1.1|336699AF-CBD5-49CB-9CB0-C1FA33516F6D|2026-03-19T13:56:27|SAT970701NN3|M8OybUfDc9Dfz1qv5VnbBvb4N/N81zcduVaBAicRjIpqdsxSPTqR3h+W2xFqu1Ex3NwY4Y+Xqg/7ll1FnimqbWZRy4UO3uZPR1HNisgVVm6+vzCfi4aNZAHMJW/qpdHMZSTOGrKsZjrafH0f9lhp7KhAkXWrhK10l/XfE5dZIbGnEdIzLsPys3Pr83kwJQge06D4KhPlf6FcIXYmkkLiFxPrN0XkrWRbnR1c/eiHCa3uWSGu4ucRT+7LuxFA9Ib4iC/ltuLmqGWIC+ET0etyNvGCN3yxp7I50orjp/Iczh1u22mD2WTGt4kfFyNZTdw3fV5+JcfAIAiGZSe4CaUTGA==|00001000000705250068||',
  },
};

function formatMXN(n) {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} M.N.`;
}
function wrapText(text, maxChars) {
  if (text.length <= maxChars) return [text];
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const w of words) {
    if ((current + ' ' + w).trim().length <= maxChars) { current = (current + ' ' + w).trim(); }
    else { if (current) lines.push(current); current = w; }
  }
  if (current) lines.push(current);
  return lines;
}
function extractCertDate(cadena) {
  const m = cadena.match(/\|\|[\d.]+\|[0-9A-F-]{36}\|(\d{4}-\d{2}-\d{2}T[\d:]+)/i);
  return m ? m[1].replace('T', ' ') : '';
}
function numToWords(n) {
  const ones = ['','UN','DOS','TRES','CUATRO','CINCO','SEIS','SIETE','OCHO','NUEVE','DIEZ','ONCE','DOCE','TRECE','CATORCE','QUINCE','DIECISÉIS','DIECISIETE','DIECIOCHO','DIECINUEVE'];
  const tens  = ['','DIEZ','VEINTE','TREINTA','CUARENTA','CINCUENTA','SESENTA','SETENTA','OCHENTA','NOVENTA'];
  const hunds = ['','CIENTO','DOSCIENTOS','TRESCIENTOS','CUATROCIENTOS','QUINIENTOS','SEISCIENTOS','SETECIENTOS','OCHOCIENTOS','NOVECIENTOS'];
  if (n === 0) return 'CERO';
  if (n === 100) return 'CIEN';
  let r = '';
  if (n >= 1000) { const t = Math.floor(n/1000); r += t === 1 ? 'MIL ' : numToWords(t)+' MIL '; n %= 1000; }
  if (n >= 100)  { r += hunds[Math.floor(n/100)]+' '; n %= 100; }
  if (n >= 20)   { r += tens[Math.floor(n/10)]; if (n%10) r += ' Y '+ones[n%10]; r += ' '; }
  else if (n > 0){ r += ones[n]+' '; }
  return r.trim();
}
function totalToLetras(total) {
  const int = Math.floor(total);
  const dec = Math.round((total - int) * 100);
  return `${numToWords(int)} PESOS ${String(dec).padStart(2,'0')}/100 M.N.`;
}

async function run() {
  // Create document from scratch
  const pdfDoc = await PDFDocument.create();
  const page   = pdfDoc.addPage([815, 1050]);
  console.log(`✓ Page created — size: 815.0 × 1050.0 pt`);

  pdfDoc.registerFontkit(fontkit);
  let font, fontBold;
  try {
    const rawBytes  = fs.readFileSync(path.join(ROOT, 'public', 'Shree714.ttc'));
    const fontBytes = extractFirstTTFFromTTC(rawBytes);
    font = await pdfDoc.embedFont(fontBytes);
    fontBold = font;
    console.log('✓ Font Shree714.ttc loaded successfully');
  } catch (e) {
    console.warn('⚠ Font fallback to Helvetica:', e.message);
    font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  }

  const black     = rgb(0, 0, 0);
  const blue      = rgb(0.118, 0.227, 0.373);
  const gray      = rgb(0.42,  0.447, 0.502);
  const red       = rgb(0.85,  0.11,  0.11);
  const lightgray = rgb(0.9,   0.9,   0.9);

  const draw = (text, x, y, opts = {}) => {
    const sz      = opts.size  ?? 7;
    const color   = opts.color ?? black;
    const f       = opts.bold  ? fontBold : font;
    const display = opts.maxWidth ? (text.length > opts.maxWidth ? text.slice(0, opts.maxWidth-1)+'…' : text) : text;
    page.drawText(display, { x, y, size: sz, font: f, color });
  };
  const rightAlign = (text, x, y, sz = 7) => {
    const w = font.widthOfTextAtSize(text, sz);
    draw(text, x - w, y, { size: sz });
  };
  const colCenter = (text, x0, x1, y, sz) => {
    const w = font.widthOfTextAtSize(text, sz);
    draw(text, (x0+x1)/2 - w/2, y, { size: sz });
  };

  // IVA recalculation
  const subtotal = data.totales.subtotal;
  let iva   = data.totales.iva;
  let total = data.totales.total;
  if (iva === 0 && subtotal > 0) {
    iva   = Math.round(subtotal * 0.16 * 100) / 100;
    total = Math.round((subtotal + iva) * 100) / 100;
    console.log(`✓ IVA recalculated: ${iva} (total: ${total})`);
  }
  const montoConLetra = data.totales.montoConLetra || totalToLetras(total);

  const { receptor, factura, conceptos, sellos } = data;
  const serieYFolio = factura.serieYFolio?.trim() || 'S/N';
  const certDate    = extractCertDate(sellos.cadenaOriginal);
  console.log(`✓ Cert date extracted: "${certDate}"`);

  const cadParts   = sellos.cadenaOriginal.split('|').filter(Boolean);
  const rfcPAC     = cadParts[3] || '';
  const certSerial = cadParts[5] || '';

  // Outer border
  page.drawRectangle({ x: 50.5, y: 50.5, width: 714, height: 949, borderColor: black, borderWidth: 0.5 });

  // ── SECTION 1 — HEADER ────────────────────────────────────────────────────
  page.drawRectangle({ x:  95, y: 935, width: 20, height: 20, color: red });
  page.drawRectangle({ x: 115, y: 895, width: 20, height: 20, color: red });
  page.drawRectangle({ x: 115, y: 935, width: 20, height: 20, color: rgb(0.5,  0.05, 0.05) });
  page.drawRectangle({ x: 115, y: 915, width: 20, height: 20, color: rgb(0.35, 0.05, 0.05) });
  page.drawRectangle({ x: 135, y: 935, width: 20, height: 20, color: rgb(0.25, 0.05, 0.05) });
  draw('TRIPOLI MEDIA', 188, 921, { size: 20, color: red, bold: true });
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
  page.drawLine({ start: { x: 87.5, y: 850 }, end: { x: 727.5, y: 850 }, thickness: 0.5, color: black });

  // ── SECTION 2 — RECEPTOR + FACTURA ───────────────────────────────────────
  page.drawLine({ start: { x: 407.5, y: 705 }, end: { x: 407.5, y: 820 }, thickness: 0.5, color: black });
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
  draw('DATOS DE LA FACTURA',          427, 810, { size: 7, color: blue, bold: true });
  draw('Folio Fiscal:',                427, 781, { size: 7, color: blue });
  draw(factura.folioFiscalUUID,        484, 781, { size: 6.5 });
  draw('No. de serie del CSD:',        427, 767, { size: 7, color: blue });
  draw(serieYFolio,                    531, 767, { size: 6.5 });
  draw('Fecha y hora de emisión:',     427, 753, { size: 7, color: blue });
  draw(factura.fechaEmision,           548, 753, { size: 7 });
  draw('Código Postal de expedición:', 427, 739, { size: 7, color: blue });
  draw(factura.lugarExpedicion,        565, 739, { size: 7 });
  draw('Forma de pago:',               427, 725, { size: 7, color: blue });
  draw(factura.formaPago,              504, 725, { size: 7 });
  draw('Método de pago:',              427, 711, { size: 7, color: blue });
  draw(factura.metodoPago,             510, 711, { size: 7 });
  page.drawLine({ start: { x: 87.5, y: 675 }, end: { x: 727.5, y: 675 }, thickness: 0.5, color: black });

  // ── SECTION 3 — CONCEPTOS ────────────────────────────────────────────────
  draw('Conceptos', 98, 637, { size: 18 });
  page.drawRectangle({ x: 87.5, y: 552.5, width: 640, height: 48.9, color: lightgray });
  page.drawLine({ start: { x: 87.5, y: 601.4 }, end: { x: 727.5, y: 601.4 }, thickness: 0.3, color: black });
  page.drawLine({ start: { x: 87.5, y: 552.5 }, end: { x: 727.5, y: 552.5 }, thickness: 0.3, color: black });
  for (const divX of [210, 327.5, 407.5, 490, 609]) {
    page.drawLine({ start: { x: divX, y: 478.6 }, end: { x: divX, y: 601.4 }, thickness: 0.3, color: gray });
  }
  colCenter('Clave SAT',    87.5, 210,   562, 8);
  colCenter('Descripción',  210,  327.5, 562, 8);
  colCenter('Unidad',       327.5, 407.5, 562, 8);
  colCenter('Cant.',        407.5, 490,   562, 8);
  colCenter('Precio',       490,  609,   562, 8);
  colCenter('Total',        609,  727.5, 562, 8);
  conceptos.slice(0, 5).forEach((c, i) => {
    const yRow = 517 - i * 30;
    colCenter(c.claveSAT,                  87.5, 210,   yRow, 7);
    const descLines = wrapText(c.descripcion, 20);
    descLines.slice(0, 2).forEach((line, j) => draw(line, 215, yRow - j*10, { size: 7 }));
    colCenter(c.unidad,                    327.5, 407.5, yRow, 7);
    colCenter(String(c.cantidad),          407.5, 490,   yRow, 7);
    rightAlign(formatMXN(c.valorUnitario), 600, yRow, 7);
    rightAlign(formatMXN(c.importe),       720, yRow, 7);
  });
  page.drawLine({ start: { x: 87.5, y: 503   }, end: { x: 727.5, y: 503   }, thickness: 0.5, color: black });
  page.drawLine({ start: { x: 87.5, y: 413.5 }, end: { x: 727.5, y: 413.5 }, thickness: 0.5, color: black });

  // ── SECTION 4 — TOTALES + CERT INFO ──────────────────────────────────────
  page.drawRectangle({ x: 97, y: 306, width: 76, height: 76, borderColor: gray, borderWidth: 0.5 });
  draw('Fecha y hora de Certificación:',      182, 366, { size: 7, color: blue });
  draw(certDate,                              287, 366, { size: 7 });
  draw('RFC del proveedor de certificación:', 182, 346, { size: 7, color: blue });
  draw(rfcPAC,                               306, 346, { size: 7 });
  draw('No. de serie del certificado SAT:',   182, 326, { size: 7, color: blue });
  draw(certSerial,                            296, 326, { size: 7 });
  draw('Este documento es una representación impresa de un CFDI', 182, 306, { size: 6, color: gray });
  draw('Subtotal :',     548, 369, { size: 8 });
  rightAlign(formatMXN(subtotal), 720, 369, 8);
  draw('+ I.V.A. 16% :', 516, 341, { size: 8 });
  rightAlign(formatMXN(iva),      720, 341, 8);
  draw('Total :',        564, 313, { size: 9, bold: true });
  rightAlign(formatMXN(total),    720, 313, 9);
  const letraLines = wrapText(montoConLetra, 95);
  letraLines.slice(0, 2).forEach((line, i) => {
    const lw = font.widthOfTextAtSize(line, 7);
    draw(line, (490+727)/2 - lw/2, 286 - i*9, { size: 7, color: gray });
  });
  page.drawLine({ start: { x: 87.5, y: 274.5 }, end: { x: 727.5, y: 274.5 }, thickness: 0.5, color: black });

  // ── SECTION 5 — SELLOS ───────────────────────────────────────────────────
  if (sellos.selloCFDI) {
    draw('Sello Digital del CFDI:', 97.5, 255, { size: 7, color: blue });
    wrapText(sellos.selloCFDI, 140).slice(0, 3).forEach((line, i) => draw(line, 97.5, 246 - i*7, { size: 5 }));
  }
  if (sellos.selloSAT) {
    draw('Sello del SAT:', 97.5, 223, { size: 7, color: blue });
    wrapText(sellos.selloSAT, 140).slice(0, 3).forEach((line, i) => draw(line, 97.5, 214 - i*7, { size: 5 }));
  }
  if (sellos.cadenaOriginal) {
    draw('Cadena Original del Complemento de Certificación Digital del SAT:', 97.5, 190, { size: 7, color: blue });
    wrapText(sellos.cadenaOriginal, 140).slice(0, 3).forEach((line, i) => draw(line, 97.5, 181 - i*7, { size: 5 }));
  }
  page.drawLine({ start: { x: 87.5, y: 164.5 }, end: { x: 727.5, y: 164.5 }, thickness: 0.5, color: black });

  // ── SECTION 6 — FOOTER ───────────────────────────────────────────────────
  draw('www.tripoli.media',                                                    97, 139, { size: 8 });
  draw('+52 33 2817 5756',                                                     97, 125, { size: 8 });
  draw('contacto@tripoli.media',                                               97, 111, { size: 8 });
  draw('Av. de las Rosas 585 int. 2, Chapalita Oriente 45040, Zapopan, Jal.', 97,  97, { size: 7 });
  page.drawLine({ start: { x: 487.5, y: 120 }, end: { x: 647.5, y: 120 }, thickness: 0.5, color: black });
  draw('Lic. Moisés Monraz Escoto', 494, 108, { size: 8 });
  draw('Dir. Tripoli Media',        529,  96, { size: 7, color: gray });

  const outPath = path.join(ROOT, 'scripts', 'test-invoice-output.pdf');
  fs.writeFileSync(outPath, await pdfDoc.save());
  console.log(`\n✓ Output written → ${outPath}`);
  console.log('  Open it to inspect the from-scratch layout');
}

run().catch(console.error);
