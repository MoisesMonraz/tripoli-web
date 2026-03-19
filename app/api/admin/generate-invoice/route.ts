import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminSessionCookieName, verifyAdminSession } from '../../../../lib/security/adminSession';
import type { InvoiceData } from '../../../../components/admin/FacturacionModule';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer';
import type { DocumentProps } from '@react-pdf/renderer';
import React, { type ReactElement } from 'react';

// ─── Brand constants ──────────────────────────────────────────────────────────

const EMISOR_RFC = 'MOEM000520NK2';
const EMISOR_NOMBRE_DEFAULT = 'Moisés Monraz Escoto';
const EMISOR_DIRECCION = 'Av. de las Rosas 585 int. 2, Chapalita Oriente, 45040, Zapopan, Jal.';

// ─── Color palette ────────────────────────────────────────────────────────────

const BLACK       = '#000000';
const DARK_BLUE   = '#1E3A5F';
const WHITE       = '#FFFFFF';
const LIGHT_GRAY  = '#F5F7FA';
const DIVIDER     = '#D1D5DB';
const ALT_ROW     = '#F9F9F9';
const TEXT_DARK   = '#1F2937';
const TEXT_GRAY   = '#6B7280';
const TEXT_LIGHT  = '#9CA3AF';
const FOOTER_ACC  = '#93C5FD';

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // Page
  page: {
    fontFamily: 'Helvetica',
    fontSize: 7.5,
    color: TEXT_DARK,
    backgroundColor: WHITE,
    paddingBottom: 100,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: BLACK,
    paddingHorizontal: 40,
    paddingTop: 22,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: { flex: 1 },
  headerCompany: {
    color: WHITE,
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1.5,
  },
  headerTagline: { color: TEXT_LIGHT, fontSize: 7.5, marginTop: 3 },
  headerRight: { alignItems: 'flex-end' },
  headerFacturaLabel: {
    color: WHITE,
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 3,
  },
  headerFolio: {
    color: TEXT_LIGHT,
    fontSize: 8,
    marginTop: 2,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
  },
  headerDirector: {
    color: TEXT_LIGHT,
    fontSize: 6.5,
    marginTop: 8,
    textAlign: 'right',
    lineHeight: 1.6,
  },

  // ── Sections ────────────────────────────────────────────────────────────────
  section: { paddingHorizontal: 40, paddingVertical: 14 },
  sectionGray:  { backgroundColor: LIGHT_GRAY },
  sectionWhite: { backgroundColor: WHITE },

  sectionTitle: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: DARK_BLUE,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 9,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
  },

  row2: { flexDirection: 'row', gap: 20 },
  col: { flex: 1 },

  // ── Field rows ──────────────────────────────────────────────────────────────
  fieldRow: { flexDirection: 'row', marginBottom: 4, flexWrap: 'wrap' },
  fieldLabel: { color: TEXT_GRAY, fontSize: 7, width: 108, flexShrink: 0 },
  fieldValue: { flex: 1, color: TEXT_DARK, fontSize: 7, fontFamily: 'Helvetica-Bold' },

  // ── Divider ─────────────────────────────────────────────────────────────────
  divider: { height: 1, backgroundColor: DIVIDER },

  // ── Conceptos ───────────────────────────────────────────────────────────────
  conceptosTitle: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    color: DARK_BLUE,
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: DARK_BLUE,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderCell: { color: WHITE, fontSize: 7, fontFamily: 'Helvetica-Bold' },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  tableRowAlt: { backgroundColor: ALT_ROW },
  tableCell:  { fontSize: 7, color: TEXT_DARK },
  colClave:   { width: 58 },
  colDesc:    { flex: 1 },
  colUnidad:  { width: 52 },
  colCant:    { width: 32, textAlign: 'right' },
  colPrecio:  { width: 68, textAlign: 'right' },
  colTotal:   { width: 70, textAlign: 'right' },

  // ── Totales ─────────────────────────────────────────────────────────────────
  totalesWrapper: { alignItems: 'flex-end', marginTop: 10, marginBottom: 4 },
  totalesBox: { width: 235 },
  totalesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  totalesLabel: { color: TEXT_GRAY, fontSize: 7.5 },
  totalesValue: { color: TEXT_DARK, fontSize: 7.5, fontFamily: 'Helvetica-Bold' },
  totalesTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    marginTop: 2,
    borderTopWidth: 2,
    borderTopColor: DARK_BLUE,
  },
  totalLabel: { color: DARK_BLUE, fontSize: 9.5, fontFamily: 'Helvetica-Bold' },
  totalValue: { color: DARK_BLUE, fontSize: 9.5, fontFamily: 'Helvetica-Bold' },
  letras: {
    fontSize: 6.5,
    color: TEXT_LIGHT,
    fontFamily: 'Helvetica-Oblique',
    textAlign: 'right',
    marginTop: 5,
    maxWidth: 235,
  },

  // ── Sellos ──────────────────────────────────────────────────────────────────
  selloBlock: { marginBottom: 8 },
  selloLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: DARK_BLUE,
    marginBottom: 2,
  },
  selloValue: { fontSize: 5.5, color: TEXT_GRAY, lineHeight: 1.5 },

  // ── Footer (fixed) ──────────────────────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: DARK_BLUE,
    paddingHorizontal: 40,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  footerCol:       { flex: 1 },
  footerColCenter: { flex: 1, alignItems: 'center' },
  footerColRight:  { width: 76, alignItems: 'center' },
  footerLabel:     { color: FOOTER_ACC, fontSize: 5.5, marginBottom: 1 },
  footerLabelTop:  { color: FOOTER_ACC, fontSize: 5.5, marginBottom: 1, marginTop: 4 },
  footerValue:     { color: WHITE, fontSize: 6.5, marginBottom: 3 },
  footerContact:   { color: WHITE, fontSize: 6.5, marginBottom: 2 },
  footerNote:      { color: FOOTER_ACC, fontSize: 5.5, marginTop: 4, fontFamily: 'Helvetica-Oblique' },
  qrBox: {
    width: 56,
    height: 56,
    backgroundColor: '#6B7280',
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrText:    { color: WHITE, fontSize: 8, fontFamily: 'Helvetica-Bold' },
  qrCaption: { color: FOOTER_ACC, fontSize: 5.5, marginTop: 3 },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMXN(n: number): string {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} M.N.`;
}

/** Parse certification timestamp from cadena original: ||1.1|UUID|2026-03-19T13:56:27|... */
function extractCertDate(cadena: string): string {
  const m = cadena.match(/\|\|[\d.]+\|[0-9A-F-]{36}\|(\d{4}-\d{2}-\d{2}T[\d:]+)/i);
  return m ? m[1].replace('T', ' ') : '';
}

/** Number → Spanish words (covers 0 – 999,999) */
function numToWords(n: number): string {
  const ones = [
    '', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE',
    'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE',
    'DIECIOCHO', 'DIECINUEVE',
  ];
  const tens     = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const hundreds = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];
  if (n === 0) return 'CERO';
  if (n === 100) return 'CIEN';
  let r = '';
  if (n >= 1000) { const t = Math.floor(n / 1000); r += t === 1 ? 'MIL ' : numToWords(t) + ' MIL '; n %= 1000; }
  if (n >= 100)  { r += hundreds[Math.floor(n / 100)] + ' '; n %= 100; }
  if (n >= 20)   { r += tens[Math.floor(n / 10)]; if (n % 10 !== 0) r += ' Y ' + ones[n % 10]; r += ' '; }
  else if (n > 0){ r += ones[n] + ' '; }
  return r.trim();
}

function totalToLetras(total: number): string {
  const int = Math.floor(total);
  const dec = Math.round((total - int) * 100);
  return `${numToWords(int)} PESOS ${String(dec).padStart(2, '0')}/100 M.N.`;
}

/** Renders a label + bold value row */
function field(label: string, value: string): React.ReactElement {
  return React.createElement(
    View,
    { style: s.fieldRow },
    React.createElement(Text, { style: s.fieldLabel }, label),
    React.createElement(Text, { style: s.fieldValue }, value || '—')
  );
}

// ─── PDF Document ─────────────────────────────────────────────────────────────

function InvoiceDocument({ data }: { data: InvoiceData }): ReactElement<DocumentProps> {
  const { emisor, receptor, factura, conceptos, sellos } = data;

  // IVA recalculation: if the SAT PDF had iva=0 but subtotal>0, recalculate
  const subtotal  = data.totales.subtotal;
  let iva         = data.totales.iva;
  let total       = data.totales.total;
  const ivaWasZero = iva === 0 && subtotal > 0;
  if (ivaWasZero) {
    iva   = Math.round(subtotal * 0.16 * 100) / 100;
    total = Math.round((subtotal + iva) * 100) / 100;
  }
  const montoConLetra = ivaWasZero
    ? totalToLetras(total)
    : (data.totales.montoConLetra || totalToLetras(total));

  const serieYFolio = factura.serieYFolio?.trim() || 'S/N';
  const folio8      = factura.folioFiscalUUID?.slice(0, 8) || '';
  const certDate    = extractCertDate(sellos.cadenaOriginal);

  return React.createElement(
    Document,
    { title: `Factura ${factura.folioFiscalUUID}`, author: 'Tripoli Media' },
    React.createElement(
      Page,
      { size: 'A4', style: s.page },

      // ── Header ────────────────────────────────────────────────────────────
      React.createElement(
        View,
        { style: s.header },
        React.createElement(
          View,
          { style: s.headerLeft },
          React.createElement(Text, { style: s.headerCompany }, 'TRIPOLI MEDIA'),
          React.createElement(Text, { style: s.headerTagline }, 'Publicidad · Marketing · Medios')
        ),
        React.createElement(
          View,
          { style: s.headerRight },
          React.createElement(Text, { style: s.headerFacturaLabel }, 'FACTURA'),
          React.createElement(Text, { style: s.headerFolio }, folio8),
          React.createElement(Text, { style: s.headerDirector }, 'Lic. Moisés Monraz Escoto\nDir. Tripoli Media')
        )
      ),

      // ── Section 1: Datos del Emisor (light gray) ──────────────────────────
      React.createElement(
        View,
        { style: [s.section, s.sectionGray] },
        React.createElement(Text, { style: s.sectionTitle }, 'DATOS DEL EMISOR'),
        field('RFC:', EMISOR_RFC),
        field('Nombre/Razón Social:', emisor.nombre || EMISOR_NOMBRE_DEFAULT),
        field('Régimen Fiscal:', emisor.regimenFiscal),
        field('Dirección Fiscal:', EMISOR_DIRECCION)
      ),

      React.createElement(View, { style: s.divider }),

      // ── Section 2: Datos de la Factura (white, 2-col) ─────────────────────
      React.createElement(
        View,
        { style: [s.section, s.sectionWhite] },
        React.createElement(Text, { style: s.sectionTitle }, 'DATOS DE LA FACTURA'),
        React.createElement(
          View,
          { style: s.row2 },
          React.createElement(
            View,
            { style: s.col },
            field('Folio Fiscal (UUID):', factura.folioFiscalUUID),
            field('Serie y Folio:', serieYFolio),
            field('Fecha de Emisión:', factura.fechaEmision)
          ),
          React.createElement(
            View,
            { style: s.col },
            field('Lugar de Expedición:', factura.lugarExpedicion),
            field('Forma de Pago:', factura.formaPago),
            field('Método de Pago:', factura.metodoPago)
          )
        )
      ),

      React.createElement(View, { style: s.divider }),

      // ── Section 3: Datos del Receptor (light gray) ────────────────────────
      React.createElement(
        View,
        { style: [s.section, s.sectionGray] },
        React.createElement(Text, { style: s.sectionTitle }, 'DATOS DEL RECEPTOR'),
        field('RFC:', receptor.rfc),
        field('Nombre/Razón Social:', receptor.nombre),
        field('Régimen Fiscal:', receptor.regimenFiscal),
        field('Dirección Fiscal:', receptor.codigoPostal),
        field('Uso de CFDI:', receptor.usoCFDI)
      ),

      React.createElement(View, { style: s.divider }),

      // ── Section 4+5: Conceptos + Totales (white) ──────────────────────────
      React.createElement(
        View,
        { style: [s.section, s.sectionWhite] },

        React.createElement(Text, { style: s.conceptosTitle }, 'Conceptos'),

        // Table header
        React.createElement(
          View,
          { style: s.tableHeader },
          React.createElement(Text, { style: [s.tableHeaderCell, s.colClave] }, 'Clave SAT'),
          React.createElement(Text, { style: [s.tableHeaderCell, s.colDesc] }, 'Descripción'),
          React.createElement(Text, { style: [s.tableHeaderCell, s.colUnidad] }, 'Unidad'),
          React.createElement(Text, { style: [s.tableHeaderCell, s.colCant] }, 'Cant.'),
          React.createElement(Text, { style: [s.tableHeaderCell, s.colPrecio] }, 'Precio'),
          React.createElement(Text, { style: [s.tableHeaderCell, s.colTotal] }, 'Total')
        ),

        // Concept rows (alternating colors)
        ...conceptos.map((c, i) =>
          React.createElement(
            View,
            { key: String(i), style: i % 2 === 1 ? [s.tableRow, s.tableRowAlt] : s.tableRow },
            React.createElement(Text, { style: [s.tableCell, s.colClave] }, c.claveSAT),
            React.createElement(Text, { style: [s.tableCell, s.colDesc] }, c.descripcion),
            React.createElement(Text, { style: [s.tableCell, s.colUnidad] }, c.unidad),
            React.createElement(Text, { style: [s.tableCell, s.colCant] }, String(c.cantidad)),
            React.createElement(Text, { style: [s.tableCell, s.colPrecio] }, formatMXN(c.valorUnitario)),
            React.createElement(Text, { style: [s.tableCell, s.colTotal] }, formatMXN(c.importe))
          )
        ),

        // Totales (right-aligned block)
        React.createElement(
          View,
          { style: s.totalesWrapper },
          React.createElement(
            View,
            { style: s.totalesBox },
            React.createElement(
              View,
              { style: s.totalesRow },
              React.createElement(Text, { style: s.totalesLabel }, 'Subtotal:'),
              React.createElement(Text, { style: s.totalesValue }, formatMXN(subtotal))
            ),
            React.createElement(
              View,
              { style: s.totalesRow },
              React.createElement(Text, { style: s.totalesLabel }, '+ I.V.A. 16%:'),
              React.createElement(Text, { style: s.totalesValue }, formatMXN(iva))
            ),
            React.createElement(
              View,
              { style: s.totalesTotal },
              React.createElement(Text, { style: s.totalLabel }, 'TOTAL:'),
              React.createElement(Text, { style: s.totalValue }, formatMXN(total))
            ),
            React.createElement(Text, { style: s.letras }, montoConLetra)
          )
        )
      ),

      React.createElement(View, { style: s.divider }),

      // ── Section 6: Sellos Digitales (light gray) ──────────────────────────
      React.createElement(
        View,
        { style: [s.section, s.sectionGray] },
        React.createElement(Text, { style: s.sectionTitle }, 'SELLOS DIGITALES'),
        sellos.selloCFDI
          ? React.createElement(
              View,
              { style: s.selloBlock },
              React.createElement(Text, { style: s.selloLabel }, 'Sello Digital del CFDI:'),
              React.createElement(Text, { style: s.selloValue }, sellos.selloCFDI)
            )
          : null,
        sellos.selloSAT
          ? React.createElement(
              View,
              { style: s.selloBlock },
              React.createElement(Text, { style: s.selloLabel }, 'Sello Digital del SAT:'),
              React.createElement(Text, { style: s.selloValue }, sellos.selloSAT)
            )
          : null,
        sellos.cadenaOriginal
          ? React.createElement(
              View,
              { style: s.selloBlock },
              React.createElement(
                Text,
                { style: s.selloLabel },
                'Cadena Original del Complemento de Certificación Digital del SAT:'
              ),
              React.createElement(Text, { style: s.selloValue }, sellos.cadenaOriginal)
            )
          : null
      ),

      // ── Footer (fixed — repeats on every page) ────────────────────────────
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      React.createElement(
        View,
        { style: s.footer, fixed: true } as React.ComponentProps<typeof View> & { fixed?: boolean },

        // Left: folio + cert date + legal note
        React.createElement(
          View,
          { style: s.footerCol },
          React.createElement(Text, { style: s.footerLabel }, 'Folio Fiscal:'),
          React.createElement(Text, { style: s.footerValue }, factura.folioFiscalUUID),
          certDate
            ? React.createElement(
                Text,
                { style: s.footerLabelTop },
                `Fecha de Certificación: ${certDate}`
              )
            : null,
          React.createElement(
            Text,
            { style: s.footerNote },
            'Este documento es una representación impresa de un CFDI'
          )
        ),

        // Center: contact info
        React.createElement(
          View,
          { style: s.footerColCenter },
          React.createElement(Text, { style: s.footerContact }, 'www.tripoli.media'),
          React.createElement(Text, { style: s.footerContact }, 'contacto@tripoli.media'),
          React.createElement(Text, { style: s.footerContact }, '+52 33 2817 5756'),
          React.createElement(Text, { style: s.footerContact }, 'Av. de las Rosas 585 int. 2, Zapopan, Jal.')
        ),

        // Right: QR placeholder
        // TODO: Generate QR from SAT verification URL
        // (see https://verificacfdi.facturaelectronica.sat.gob.mx)
        React.createElement(
          View,
          { style: s.footerColRight },
          React.createElement(
            View,
            { style: s.qrBox },
            React.createElement(Text, { style: s.qrText }, 'QR')
          ),
          React.createElement(Text, { style: s.qrCaption }, 'QR SAT')
        )
      )
    )
  );
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

    const pdfBuffer = await renderToBuffer(
      React.createElement(InvoiceDocument, { data }) as unknown as ReactElement<DocumentProps>
    );

    const uuid = data.factura?.folioFiscalUUID?.slice(0, 8) || 'factura';
    const filename = `factura-tripoli-${uuid}.pdf`;

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBuffer.length),
      },
    });
  } catch (err) {
    console.error('[generate-invoice]', err);
    return NextResponse.json(
      { error: 'No se pudo generar el PDF.' },
      { status: 500 }
    );
  }
}
