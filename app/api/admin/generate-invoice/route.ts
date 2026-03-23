import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const QRCode = require('qrcode') as { toDataURL(text: string, opts?: { width?: number; margin?: number }): Promise<string> };
import { getAdminSessionCookieName, verifyAdminSession } from '../../../../lib/security/adminSession';
import type { InvoiceData } from '../../../../components/admin/FacturacionModule';

// ─── Background image (loaded once at cold start) ─────────────────────────────
const bgPath    = path.join(process.cwd(), 'public', 'factura-bg.png');
const bgBase64  = fs.readFileSync(bgPath).toString('base64');
const bgDataURL = `data:image/png;base64,${bgBase64}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// HTML-escape user data
function esc(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── HTML Template ────────────────────────────────────────────────────────────

async function buildInvoiceHTML(data: InvoiceData): Promise<string> {
  const subtotal = data.totales.subtotal;
  const iva      = data.totales.iva === 0 && subtotal > 0
    ? Math.round(subtotal * 0.16 * 100) / 100
    : data.totales.iva;
  const total         = Math.round((subtotal + iva) * 100) / 100;
  const montoConLetra = totalToLetras(total);

  const { receptor, factura, conceptos, sellos } = data;
  const certDate   = extractCertDate(sellos.cadenaOriginal);
  const cadParts   = sellos.cadenaOriginal.split('|').filter(Boolean);
  const rfcPAC     = cadParts[3] || 'SAT970701NN3';
  const certSerial = cadParts[5] || '';
  const noCertSAT  = cadParts[cadParts.length - 1] || '';

  // SAT verification URL for QR
  const satUrl = [
    'https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx',
    `?id=${factura.folioFiscalUUID}`,
    `&re=MOEM000520NK2`,
    `&rr=${encodeURIComponent(receptor.rfc)}`,
    `&tt=${total.toFixed(6)}`,
    `&fe=${encodeURIComponent(sellos.selloCFDI.slice(-8))}`,
  ].join('');

  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(satUrl, { width: 76, margin: 1 });
  } catch { /* fall through — QR omitted */ }

  const truncSello = (s: string, max = 250) =>
    s.length > max ? s.slice(0, max) + '...' : s;

  // Absolutely positioned label (blue) + value (black) on one line
  const labelField = (label: string, value: string, left: number, top: number, fontSize = 10) =>
    `<div style="position:absolute;left:${left}px;top:${top}px;font-size:${fontSize}px;white-space:nowrap;z-index:1;">` +
    `<span style="color:#1E6B8A;">${esc(label)}: </span>` +
    `<span style="color:#000;">${esc(value)}</span>` +
    `</div>`;

  // Absolutely positioned value-only field
  const valField = (value: string, left: number, top: number, fontSize: number, extra = '') =>
    `<div style="position:absolute;left:${left}px;top:${top}px;font-size:${fontSize}px;color:#000;${extra}z-index:1;">${esc(value)}</div>`;

  // Concepto rows — first row at top=520, subsequent rows offset by ROW_HEIGHT
  const ROW_HEIGHT = 40;
  const conceptoOverlays = conceptos.slice(0, 5).map((c, idx) => {
    const rowTop  = 520 + idx * ROW_HEIGHT;
    const descTop = 511 + idx * ROW_HEIGHT;
    const importe = (c.importe ?? c.valorUnitario * c.cantidad).toFixed(2);
    return [
      valField(c.claveSAT,                  113, rowTop,  12, 'text-align:center;width:97px;'),
      `<div style="position:absolute;left:213px;top:${descTop}px;font-size:10px;width:114px;line-height:1.4;color:#000;word-wrap:break-word;z-index:1;">${esc(c.descripcion)}</div>`,
      valField(String(c.cantidad),           415, rowTop,  12, 'text-align:center;width:75px;'),
      valField(c.valorUnitario.toFixed(2),   525, rowTop,  12, 'text-align:center;width:84px;'),
      valField(importe,                      630, rowTop,  12, 'text-align:center;width:97px;'),
    ].join('');
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 815px; height: 1050px; overflow: hidden; }
  .page { position: relative; width: 815px; height: 1050px; font-family: 'Helvetica Neue', Arial, sans-serif; }
</style>
</head>
<body>
<div class="page">

  <!-- Background -->
  <img src="${bgDataURL}" style="position:absolute;top:0;left:0;width:815px;height:1050px;z-index:0;">

  <!-- ── DATOS DEL RECEPTOR ── -->
  ${labelField('RFC', receptor.rfc, 95, 258)}
  ${labelField('Nombre/Razón Social', receptor.nombre, 95, 274)}
  ${labelField('Régimen Fiscal', receptor.regimenFiscal, 95, 290)}
  ${labelField('Código Postal', receptor.codigoPostal, 95, 306)}
  ${labelField('Uso de CFDI', receptor.usoCFDI, 95, 322)}

  <!-- ── DATOS DE LA FACTURA ── -->
  ${labelField('Folio Fiscal', factura.folioFiscalUUID, 427, 254)}
  ${labelField('No. de serie del CSD', noCertSAT, 427, 270)}
  ${labelField('Fecha y hora de emisión', factura.fechaEmision, 427, 286)}
  ${labelField('Código Postal de expedición', factura.lugarExpedicion, 427, 302)}
  ${labelField('Forma de pago', factura.formaPago, 427, 318)}
  ${labelField('Método de pago', factura.metodoPago, 427, 334)}

  <!-- ── CONCEPTOS ── -->
  ${conceptoOverlays}

  <!-- ── TOTALES ── -->
  ${valField(total.toFixed(2),    635, 325, 12, 'font-weight:700;')}
  ${valField(subtotal.toFixed(2), 643, 369, 12)}
  ${valField(iva.toFixed(2),      635, 397, 12)}
  <div style="position:absolute;left:430px;top:282px;font-size:7px;color:#888888;width:270px;text-align:center;z-index:1;">${esc(montoConLetra)}</div>

  <!-- ── QR + CERT INFO ── -->
  ${qrDataUrl ? `<img src="${qrDataUrl}" style="position:absolute;left:97px;top:294px;width:76px;height:76px;z-index:1;">` : ''}
  ${valField(certDate,    287, 365, 7.5)}
  ${valField(rfcPAC,      306, 343, 7.5)}
  ${valField(certSerial,  296, 323, 7.5)}

  <!-- ── SELLOS DIGITALES ── -->
  ${sellos.selloCFDI
    ? `<div style="position:absolute;left:97px;top:792px;font-size:5px;width:630px;word-break:break-all;line-height:1.5;color:#000;z-index:1;">${esc(truncSello(sellos.selloCFDI))}</div>`
    : ''}
  ${sellos.selloSAT
    ? `<div style="position:absolute;left:97px;top:826px;font-size:5px;width:630px;word-break:break-all;line-height:1.5;color:#000;z-index:1;">${esc(truncSello(sellos.selloSAT))}</div>`
    : ''}
  ${sellos.cadenaOriginal
    ? `<div style="position:absolute;left:97px;top:858px;font-size:5px;width:630px;word-break:break-all;line-height:1.5;color:#000;z-index:1;">${esc(truncSello(sellos.cadenaOriginal))}</div>`
    : ''}

  <!-- ── FIRMA ── -->
  ${data.firmaBase64
    ? `<img src="${data.firmaBase64}" style="position:absolute;left:487px;top:880px;max-width:120px;max-height:50px;object-fit:contain;z-index:1;">`
    : ''}

</div>
</body>
</html>`;
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let browser: any = null;

  try {
    const body = await request.json() as { data: InvoiceData };
    const { data } = body;

    if (!data) {
      return NextResponse.json({ error: 'No se recibieron datos de factura.' }, { status: 400 });
    }

    const html = await buildInvoiceHTML(data);

    const isLocal = process.env.NODE_ENV === 'development';
    browser = await puppeteer.launch(
      isLocal
        ? {
            // Option A (default): uses locally installed Google Chrome
            channel: 'chrome',
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            // Option B: if Chrome is not installed, run:
            //   npm install --save-dev puppeteer
            // then replace the block above with:
            //   executablePath: (await import('puppeteer')).executablePath(),
            //   headless: true,
            //   args: ['--no-sandbox', '--disable-setuid-sandbox'],
          }
        : {
            args:            chromium.args,
            defaultViewport: { width: 815, height: 1050 },
            executablePath:  await chromium.executablePath(),
            headless:        true,
          }
    );

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      width:           '815px',
      height:          '1050px',
      printBackground: true,
      margin:          { top: '0', right: '0', bottom: '0', left: '0' },
      pageRanges:      '1',
    });

    const uuid     = data.factura?.folioFiscalUUID?.slice(0, 8) || 'factura';
    const filename = `factura-tripoli-${uuid}.pdf`;

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length':      String(pdfBuffer.length),
      },
    });
  } catch (err) {
    console.error('[generate-invoice]', err);
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json(
      { error: `No se pudo generar el PDF: ${message}` },
      { status: 500 }
    );
  } finally {
    if (browser) await browser.close();
  }
}
