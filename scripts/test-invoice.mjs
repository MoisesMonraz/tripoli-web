// Run: node scripts/test-invoice.mjs
// Generates test-invoice-output.pdf using the same logic as the route

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
  emisor: {
    rfc: 'MOME000520NK2',
    nombre: 'MOISÉS MONRAZ ESCOTO',
    regimenFiscal: 'Régimen Simplificado de Confianza',
    codigoPostal: '45040',
  },
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
    montoConLetra: 'UN PESOS 00/100 M.N.',
  },
  sellos: {
    selloCFDI: 'M8OybUfDc9Dfz1qv5VnbBvb4N/N81zcduVaBAicRjIpqdsxSPTqR3h+W2xFqu1Ex3NwY4Y+Xqg/7ll1FnimqbWZRy4UO3uZPR1HNisgVVm6+vzCfi4aNZAHMJW/qpdHMZSTOGrKsZjrafH0f9lhp7KhAkXWrhK10l/XfE5dZIbGnEdIzLsPys3Pr83kwJQge06D4KhPlf6FcIXYmkkLiFxPrN0XkrWRbnR1c/eiHCa3uWSGu4ucRT+7LuxFA9Ib4iC/ltuLmqGWIC+ET0etyNvGCN3yxp7I50orjp/Iczh1u22mD2WTGt4kfFyNZTdw3fV5+JcfAIAiGZSe4CaUTGA==',
    selloSAT: 'A+Y1hrJvES2B8pwEhOSJxMAafzQflGD5AYxw6pXIpYtyQKLIkCw1hgEXsY6Gl0wUUbuSSBkxrbsFcb7BXjFYBjs56VYHqnFdYFgpkaISUGl1QBPplyk8AMBwI2fOkqFx8kOUOSRx5uzH46GNH3JhEVpRItOiKMTLyO7fLI1YXg98iNb0sADy48lpD42osTs+31ArUcSWCqh4nyC4HhM7H1XF+jBauQM0Xr3ZXwpp3NueQRIh6Yxs/Fx/cGeC+dNy/jYFDN2PHcRtz3yP9LkRWRNR00QYHQ0azTi/c4xzF+6BHYDqkUe/4HhjTEi1sVcn20P1zrC1Bxr2rMnaWJI6Ng==',
    cadenaOriginal: '||1.1|336699AF-CBD5-49CB-9CB0-C1FA33516F6D|2026-03-19T13:56:27|SAT970701NN3|M8OybUfDc9Dfz1qv5VnbBvb4N/N81zcduVaBAicRjIpqdsxSPTqR3h+W2xFqu1Ex3NwY4Y+Xqg/7ll1FnimqbWZRy4UO3uZPR1HNisgVVm6+vzCfi4aNZAHMJW/qpdHMZSTOGrKsZjrafH0f9lhp7KhAkXWrhK10l/XfE5dZIbGnEdIzLsPys3Pr83kwJQge06D4KhPlf6FcIXYmkkLiFxPrN0XkrWRbnR1c/eiHCa3uWSGu4ucRT+7LuxFA9Ib4iC/ltuLmqGWIC+ET0etyNvGCN3yxp7I50orjp/Iczh1u22mD2WTGt4kfFyNZTdw3fV5+JcfAIAiGZSe4CaUTGA==|00001000000705250068||',
  },
};

// ─── Coordinate constants — scaled for 815×1050 pt template ──────────────────
const C = {
  fs: { label: 7, value: 8, small: 5.5, sello: 5 },
  rx: { value: 178 },
  receptor: { rfc: 873, nombre: 855, regimen: 838, direccion: 820, usoCFDI: 795 },
  fx: { value: 548 },
  factura: { uuid: 873, serie: 855, fecha: 838, lugar: 820, forma: 803, metodo: 786 },
  tbl: { clave: 52, desc: 158, unid: 418, cant: 504, prec: 568, tot: 678, row0: 676, rowH: 21 },
  tot: {
    folioLabel: 416, folioValue: 398, certLabel: 379, certValue: 360, noteY: 342,
    subtotalVal: 424, ivaVal: 404, totalVal: 384, letrasY: 354,
    leftX: 127, rightX: 727,
  },
  sel: { cfdiLabel: 303, cfdiValue: 288, satLabel: 262, satValue: 247, cadenaLabel: 221, cadenaValue: 206, x: 52 },
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

async function run() {
  const templatePath = path.join(ROOT, 'public', 'factura-template.pdf');
  const templateBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);
  pdfDoc.registerFontkit(fontkit);

  // Font
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

  const page = pdfDoc.getPages()[0];
  const { width, height } = page.getSize();
  console.log(`✓ Template loaded — page size: ${width.toFixed(1)} × ${height.toFixed(1)} pt`);

  const black = rgb(0, 0, 0);
  const blue  = rgb(0.118, 0.227, 0.373);
  const gray  = rgb(0.42, 0.447, 0.502);

  const draw = (text, x, y, opts = {}) => {
    const sz = opts.size ?? C.fs.value;
    const color = opts.color ?? black;
    const f = opts.bold ? fontBold : font;
    const display = opts.maxWidth ? (text.length > opts.maxWidth ? text.slice(0, opts.maxWidth - 1) + '…' : text) : text;
    page.drawText(display, { x, y, size: sz, font: f, color });
  };

  // IVA recalc
  const subtotal = data.totales.subtotal;
  let iva = data.totales.iva;
  let total = data.totales.total;
  if (iva === 0 && subtotal > 0) {
    iva = Math.round(subtotal * 0.16 * 100) / 100;
    total = Math.round((subtotal + iva) * 100) / 100;
    console.log(`✓ IVA recalculated: ${iva} (total: ${total})`);
  }

  const { receptor, factura, conceptos, sellos } = data;
  const serieYFolio = factura.serieYFolio?.trim() || 'S/N';
  const certDate = extractCertDate(sellos.cadenaOriginal);
  console.log(`✓ Cert date extracted: "${certDate}"`);

  // 1. Receptor
  draw(receptor.rfc,           C.rx.value, C.receptor.rfc,       { maxWidth: 20 });
  draw(receptor.nombre,        C.rx.value, C.receptor.nombre,     { maxWidth: 38 });
  draw(receptor.regimenFiscal, C.rx.value, C.receptor.regimen,    { maxWidth: 38 });
  draw(receptor.codigoPostal,  C.rx.value, C.receptor.direccion,  { maxWidth: 38 });
  draw(receptor.usoCFDI,       C.rx.value, C.receptor.usoCFDI,    { maxWidth: 38 });

  // 2. Factura
  draw(factura.folioFiscalUUID, C.fx.value, C.factura.uuid,   { size: C.fs.small, maxWidth: 48 });
  draw(serieYFolio,             C.fx.value, C.factura.serie,  { maxWidth: 20 });
  draw(factura.fechaEmision,    C.fx.value, C.factura.fecha,  { maxWidth: 30 });
  draw(factura.lugarExpedicion, C.fx.value, C.factura.lugar,  { maxWidth: 25 });
  draw(factura.formaPago,       C.fx.value, C.factura.forma,  { maxWidth: 30 });
  draw(factura.metodoPago,      C.fx.value, C.factura.metodo, { maxWidth: 35 });

  // 3. Conceptos
  conceptos.slice(0, 5).forEach((c, i) => {
    const y = C.tbl.row0 - i * C.tbl.rowH;
    draw(c.claveSAT,                 C.tbl.clave, y, { size: C.fs.label });
    draw(c.descripcion,              C.tbl.desc,  y, { size: C.fs.label, maxWidth: 35 });
    draw(c.unidad,                   C.tbl.unid,  y, { size: C.fs.label, maxWidth: 10 });
    draw(String(c.cantidad),         C.tbl.cant,  y, { size: C.fs.label });
    draw(formatMXN(c.valorUnitario), C.tbl.prec,  y, { size: C.fs.label });
    draw(formatMXN(c.importe),       C.tbl.tot,   y, { size: C.fs.label });
  });

  // 4. Totales
  draw('Folio Fiscal:', C.tot.leftX, C.tot.folioLabel, { size: C.fs.label, color: blue });
  draw(factura.folioFiscalUUID, C.tot.leftX, C.tot.folioValue, { size: C.fs.small, maxWidth: 55 });
  if (certDate) {
    draw('Fecha de Certificación:', C.tot.leftX, C.tot.certLabel, { size: C.fs.label, color: blue });
    draw(certDate, C.tot.leftX, C.tot.certValue, { size: C.fs.small });
  }
  draw('Este documento es una representación impresa de un CFDI', C.tot.leftX, C.tot.noteY, { size: 6, color: gray });

  const rightAlign = (text, x, y, sz = C.fs.value) => {
    const w = font.widthOfTextAtSize(text, sz);
    draw(text, x - w, y, { size: sz });
  };
  rightAlign(formatMXN(subtotal), C.tot.rightX, C.tot.subtotalVal);
  rightAlign(formatMXN(iva),      C.tot.rightX, C.tot.ivaVal);
  rightAlign(formatMXN(total),    C.tot.rightX, C.tot.totalVal, 9);

  const montoConLetra = `UN PESOS 16/100 M.N.`; // recalculated
  const pageWidth = page.getSize().width;
  const letraLines = wrapText(montoConLetra, 95);
  letraLines.forEach((line, i) => {
    const lw = font.widthOfTextAtSize(line, C.fs.label);
    draw(line, (pageWidth - lw) / 2, C.tot.letrasY - i * 9, { size: C.fs.label, color: gray });
  });

  // 5. Sellos
  if (sellos.selloCFDI) {
    draw('Sello Digital del CFDI:', C.sel.x, C.sel.cfdiLabel, { size: C.fs.label, color: blue });
    wrapText(sellos.selloCFDI, 130).slice(0, 2).forEach((line, i) => {
      draw(line, C.sel.x, C.sel.cfdiValue - i * 8, { size: C.fs.sello });
    });
  }
  if (sellos.selloSAT) {
    draw('Sello Digital del SAT:', C.sel.x, C.sel.satLabel, { size: C.fs.label, color: blue });
    wrapText(sellos.selloSAT, 130).slice(0, 2).forEach((line, i) => {
      draw(line, C.sel.x, C.sel.satValue - i * 8, { size: C.fs.sello });
    });
  }
  if (sellos.cadenaOriginal) {
    draw('Cadena Original del Complemento de Certificación Digital del SAT:', C.sel.x, C.sel.cadenaLabel, { size: C.fs.label, color: blue });
    wrapText(sellos.cadenaOriginal, 130).slice(0, 2).forEach((line, i) => {
      draw(line, C.sel.x, C.sel.cadenaValue - i * 8, { size: C.fs.sello });
    });
  }

  const outPath = path.join(ROOT, 'scripts', 'test-invoice-output.pdf');
  fs.writeFileSync(outPath, await pdfDoc.save());
  console.log(`\n✓ Output written → ${outPath}`);
  console.log('  Open it to inspect field placement and calibrate coordinates in route.ts');
}

run().catch(console.error);
