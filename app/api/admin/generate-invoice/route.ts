import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const QRCode = require('qrcode') as { toDataURL(text: string, opts?: { width?: number; margin?: number }): Promise<string> };
import { getAdminSessionCookieName, verifyAdminSession } from '../../../../lib/security/adminSession';
import type { InvoiceData } from '../../../../components/admin/FacturacionModule';

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
  const serieYFolio = factura.serieYFolio?.trim() || 'S/N';
  const certDate    = extractCertDate(sellos.cadenaOriginal);
  const cadParts    = sellos.cadenaOriginal.split('|').filter(Boolean);
  const rfcPAC      = cadParts[3] || 'SAT970701NN3';
  const certSerial  = cadParts[5] || '';
  const csdSerial   = certSerial || serieYFolio || 'S/N';

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

  const fieldRow = (label: string, value: string) =>
    `<div style="line-height:1.8;font-size:10px;">` +
    `<span style="color:#1E3A5F;font-weight:600;">${esc(label)}: </span>` +
    `<span style="color:#000;">${esc(value)}</span></div>`;

  const conceptoRows = conceptos.slice(0, 5).map(c => `
    <tr>
      <td style="padding:8px 4px;text-align:center;border-bottom:1px solid #eee;font-size:11px;">${esc(c.claveSAT)}</td>
      <td style="padding:8px 4px;text-align:left;border-bottom:1px solid #eee;font-size:11px;">${esc(c.descripcion)}</td>
      <td style="padding:8px 4px;text-align:center;border-bottom:1px solid #eee;font-size:11px;">${esc(c.unidad)}</td>
      <td style="padding:8px 4px;text-align:center;border-bottom:1px solid #eee;font-size:11px;">${c.cantidad}</td>
      <td style="padding:8px 4px;text-align:right;border-bottom:1px solid #eee;font-size:11px;">${c.valorUnitario.toFixed(2)}</td>
      <td style="padding:8px 4px;text-align:right;border-bottom:1px solid #eee;font-size:11px;">${(c.importe ?? c.valorUnitario * c.cantidad).toFixed(2)}</td>
    </tr>`).join('');

  const hr = `<hr style="border:none;border-top:1px solid #ccc;margin:0;">`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    width: 815px;
    min-height: 1050px;
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-size: 10px;
    color: #000;
    background: #fff;
  }
</style>
</head>
<body>
<div style="width:815px;min-height:1050px;padding:40px;border:1px solid #ccc;">

  <!-- ── SECTION 1: HEADER ── -->
  <div style="display:flex;align-items:flex-start;padding-bottom:20px;min-height:160px;">

    <!-- Left: Logo + brand name -->
    <div style="width:42%;display:flex;flex-direction:column;gap:14px;">
      <div style="position:relative;width:65px;height:65px;flex-shrink:0;">
        <div style="position:absolute;left:0px;top:0px;width:20px;height:20px;background:#3373B2;"></div>
        <div style="position:absolute;left:20px;top:0px;width:20px;height:20px;background:#8CB4D8;"></div>
        <div style="position:absolute;left:40px;top:0px;width:20px;height:20px;background:#B3CDE8;"></div>
        <div style="position:absolute;left:20px;top:20px;width:20px;height:20px;background:#6194C7;"></div>
        <div style="position:absolute;left:20px;top:40px;width:20px;height:20px;background:#3373B2;"></div>
      </div>
      <div style="font-size:24px;font-weight:600;color:#1E3A5F;letter-spacing:2px;">TRIPOLI MEDIA</div>
    </div>

    <!-- Right: Emisor data -->
    <div style="width:58%;padding-left:24px;border-left:1px solid #e5e5e5;">
      <div style="font-size:10px;color:#1E3A5F;font-weight:700;letter-spacing:0.5px;margin-bottom:8px;">DATOS DEL EMISOR</div>
      ${fieldRow('RFC', 'MOEM000520NK2')}
      ${fieldRow('Nombre/Razón Social', 'Moisés Monraz Escoto')}
      ${fieldRow('Régimen Fiscal', '626 - RESICO')}
      ${fieldRow('Dirección Fiscal', 'Av. de las Rosas 585 int. 2, Chapalita Oriente 45040, Zapopan, Jal.')}
    </div>
  </div>

  ${hr}

  <!-- ── SECTION 2: RECEPTOR + FACTURA ── -->
  <div style="display:flex;padding:18px 0;min-height:150px;">

    <!-- Left: Receptor -->
    <div style="width:50%;padding-right:20px;">
      <div style="font-size:10px;color:#1E3A5F;font-weight:700;letter-spacing:0.5px;margin-bottom:8px;">DATOS DEL RECEPTOR</div>
      ${fieldRow('RFC', receptor.rfc)}
      ${fieldRow('Nombre/Razón Social', receptor.nombre)}
      ${fieldRow('Régimen Fiscal', receptor.regimenFiscal)}
      ${fieldRow('Código Postal', receptor.codigoPostal)}
      ${fieldRow('Uso de CFDI', receptor.usoCFDI)}
    </div>

    <!-- Vertical divider -->
    <div style="width:1px;background:#ccc;margin:0 20px;"></div>

    <!-- Right: Factura -->
    <div style="width:50%;padding-left:20px;">
      <div style="font-size:10px;color:#1E3A5F;font-weight:700;letter-spacing:0.5px;margin-bottom:8px;">DATOS DE LA FACTURA</div>
      ${fieldRow('Folio Fiscal', factura.folioFiscalUUID)}
      ${fieldRow('No. de serie del CSD', csdSerial)}
      ${fieldRow('Fecha y hora de emisión', factura.fechaEmision)}
      ${fieldRow('Código Postal de expedición', factura.lugarExpedicion)}
      ${fieldRow('Forma de pago', factura.formaPago)}
      ${fieldRow('Método de pago', factura.metodoPago)}
    </div>
  </div>

  ${hr}

  <!-- ── SECTION 3: CONCEPTOS ── -->
  <div style="padding:18px 0;">
    <div style="font-size:24px;color:#000;margin-bottom:16px;">Conceptos</div>
    <table style="width:100%;border-collapse:collapse;table-layout:fixed;">
      <colgroup>
        <col style="width:15%">
        <col style="width:30%">
        <col style="width:12%">
        <col style="width:8%">
        <col style="width:17%">
        <col style="width:18%">
      </colgroup>
      <thead>
        <tr style="border-top:1px solid #ccc;border-bottom:1px solid #ccc;">
          <th style="padding:8px 4px;font-size:11px;font-weight:600;color:#000;text-align:center;">Clave SAT</th>
          <th style="padding:8px 4px;font-size:11px;font-weight:600;color:#000;text-align:left;">Descripción</th>
          <th style="padding:8px 4px;font-size:11px;font-weight:600;color:#000;text-align:center;">Unidad</th>
          <th style="padding:8px 4px;font-size:11px;font-weight:600;color:#000;text-align:center;">Cant.</th>
          <th style="padding:8px 4px;font-size:11px;font-weight:600;color:#000;text-align:right;">Precio</th>
          <th style="padding:8px 4px;font-size:11px;font-weight:600;color:#000;text-align:right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${conceptoRows}
        <tr><td colspan="6" style="padding:8px;"></td></tr>
      </tbody>
    </table>
  </div>

  ${hr}

  <!-- ── SECTION 4: TOTALES + CERT INFO ── -->
  <div style="display:flex;padding:18px 0;min-height:130px;align-items:flex-start;">

    <!-- Left: QR + cert details -->
    <div style="width:55%;display:flex;gap:14px;align-items:flex-start;">
      <div style="flex-shrink:0;">
        ${qrDataUrl
          ? `<img src="${qrDataUrl}" width="76" height="76" style="display:block;">`
          : `<div style="width:76px;height:76px;border:1px solid #ccc;"></div>`}
      </div>
      <div style="font-size:7.5px;line-height:2;color:#000;">
        <div><span style="color:#1E3A5F;font-weight:600;">Fecha y hora de Certificación: </span>${esc(certDate)}</div>
        <div><span style="color:#1E3A5F;font-weight:600;">RFC del proveedor de certificación: </span>${esc(rfcPAC)}</div>
        <div><span style="color:#1E3A5F;font-weight:600;">No. de serie del certificado SAT: </span>${esc(certSerial)}</div>
        <div style="color:#888;font-size:7px;margin-top:6px;">Este documento es una representación impresa de un CFDI</div>
      </div>
    </div>

    <!-- Right: Totals -->
    <div style="width:45%;display:flex;flex-direction:column;gap:0;justify-content:center;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;font-size:12px;">
        <span>Subtotal :</span><span>$ ${subtotal.toFixed(2)} M.N.</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;font-size:12px;">
        <span>+ I.V.A. 16% :</span><span>$ ${iva.toFixed(2)} M.N.</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;font-size:12px;font-weight:700;">
        <span>Total :</span><span>$ ${total.toFixed(2)} M.N.</span>
      </div>
      <div style="font-size:7.5px;color:#888;text-align:center;margin-top:8px;">${esc(montoConLetra)}</div>
    </div>
  </div>

  ${hr}

  <!-- ── SECTION 5: SELLOS DIGITALES ── -->
  <div style="padding:14px 0;line-height:1.4;">
    ${sellos.selloCFDI ? `
    <div style="margin-bottom:8px;">
      <div style="font-size:7.5px;color:#1E3A5F;font-weight:600;margin-bottom:2px;">Sello Digital del CFDI:</div>
      <div style="font-size:5px;word-break:break-all;color:#000;">${esc(truncSello(sellos.selloCFDI))}</div>
    </div>` : ''}
    ${sellos.selloSAT ? `
    <div style="margin-bottom:8px;">
      <div style="font-size:7.5px;color:#1E3A5F;font-weight:600;margin-bottom:2px;">Sello del SAT:</div>
      <div style="font-size:5px;word-break:break-all;color:#000;">${esc(truncSello(sellos.selloSAT))}</div>
    </div>` : ''}
    ${sellos.cadenaOriginal ? `
    <div style="margin-bottom:8px;">
      <div style="font-size:7.5px;color:#1E3A5F;font-weight:600;margin-bottom:2px;">Cadena Original del Complemento de Certificación Digital del SAT:</div>
      <div style="font-size:5px;word-break:break-all;color:#000;">${esc(truncSello(sellos.cadenaOriginal))}</div>
    </div>` : ''}
  </div>

  ${hr}

  <!-- ── SECTION 6: FOOTER ── -->
  <div style="display:flex;align-items:center;padding-top:18px;">

    <!-- Left: Contact info -->
    <div style="width:55%;font-size:9px;line-height:2;color:#000;">
      <div>www.tripoli.media</div>
      <div>+52 33 2817 5756</div>
      <div>contacto@tripoli.media</div>
      <div>Av. de las Rosas 585 int. 2, Chapalita Oriente 45040, Zapopan, Jal.</div>
    </div>

    <!-- Right: Signature block -->
    <div style="width:45%;display:flex;flex-direction:column;align-items:center;gap:6px;">
      ${data.firmaBase64
        ? `<img src="${data.firmaBase64}" style="max-width:120px;max-height:50px;object-fit:contain;display:block;">`
        : ''}
      <div style="border-top:1px solid #000;width:160px;text-align:center;padding-top:6px;">
        <div style="font-size:12px;">Lic. Moisés Monraz Escoto</div>
        <div style="font-size:10px;font-style:italic;color:#555;">Dir. Tripoli Media</div>
      </div>
    </div>
  </div>

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

    browser = await puppeteer.launch({
      args:            chromium.args,
      defaultViewport: { width: 815, height: 1050 },
      executablePath:  process.env.CHROMIUM_PATH || await chromium.executablePath(),
      headless:        true,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      width:           '815px',
      height:          '1050px',
      printBackground: true,
      margin:          { top: '0', right: '0', bottom: '0', left: '0' },
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

// Tree-shake unused helpers (referenced to satisfy linter)
void formatMXN;
