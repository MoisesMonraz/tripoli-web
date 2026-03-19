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
  Font,
} from '@react-pdf/renderer';
import type { DocumentProps } from '@react-pdf/renderer';
import React, { type ReactElement } from 'react';

// ─── Styles ───────────────────────────────────────────────────────────────────

const DARK_BLUE = '#1E3A5F';
const LIGHT_BLUE = '#009fe3';
const WHITE = '#FFFFFF';
const LIGHT_GRAY = '#F5F7FA';
const MID_GRAY = '#D1D5DB';
const TEXT_DARK = '#1F2937';
const TEXT_GRAY = '#6B7280';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 7,
    color: TEXT_DARK,
    paddingBottom: 40,
  },
  // Header
  header: {
    backgroundColor: DARK_BLUE,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  companyName: {
    color: WHITE,
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
  },
  companyTagline: {
    color: LIGHT_BLUE,
    fontSize: 7.5,
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  invoiceLabel: {
    color: WHITE,
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 2,
  },
  folioText: {
    color: LIGHT_BLUE,
    fontSize: 8,
    marginTop: 2,
  },
  // Blue accent bar
  accentBar: {
    backgroundColor: LIGHT_BLUE,
    height: 4,
  },
  // Section wrapper
  body: {
    paddingHorizontal: 24,
    paddingTop: 14,
  },
  // Two-column row
  row2: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  col: {
    flex: 1,
  },
  // Section card
  card: {
    backgroundColor: LIGHT_GRAY,
    borderRadius: 4,
    padding: 10,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: DARK_BLUE,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: MID_GRAY,
    paddingBottom: 4,
  },
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  fieldLabel: {
    color: TEXT_GRAY,
    width: 95,
    fontSize: 6.5,
  },
  fieldValue: {
    flex: 1,
    color: TEXT_DARK,
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
  },
  // Conceptos table
  table: {
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: DARK_BLUE,
    borderRadius: 3,
    paddingVertical: 5,
    paddingHorizontal: 6,
    marginBottom: 1,
  },
  tableHeaderCell: {
    color: WHITE,
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: MID_GRAY,
  },
  tableRowAlt: {
    backgroundColor: LIGHT_GRAY,
  },
  tableCell: {
    fontSize: 6.5,
    color: TEXT_DARK,
  },
  colClave: { width: 60 },
  colDesc: { flex: 1 },
  colCantidad: { width: 42, textAlign: 'right' },
  colUnidad: { width: 70 },
  colValor: { width: 60, textAlign: 'right' },
  colImporte: { width: 62, textAlign: 'right' },
  // Totales
  totalesContainer: {
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  totalesCard: {
    backgroundColor: LIGHT_GRAY,
    borderRadius: 4,
    padding: 10,
    width: 200,
  },
  totalesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  totalesLabel: {
    color: TEXT_GRAY,
    fontSize: 7,
  },
  totalesValue: {
    color: TEXT_DARK,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
  },
  totalFinalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: DARK_BLUE,
    borderRadius: 3,
    paddingVertical: 5,
    paddingHorizontal: 6,
    marginTop: 4,
  },
  totalFinalLabel: {
    color: WHITE,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  totalFinalValue: {
    color: LIGHT_BLUE,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  letrasText: {
    color: TEXT_GRAY,
    fontSize: 6,
    marginTop: 4,
    textAlign: 'right',
  },
  // Sellos
  selloCard: {
    backgroundColor: LIGHT_GRAY,
    borderRadius: 4,
    padding: 8,
    marginBottom: 6,
  },
  selloTitle: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: DARK_BLUE,
    marginBottom: 3,
  },
  selloText: {
    fontSize: 5,
    color: TEXT_GRAY,
    fontFamily: 'Helvetica',
    lineHeight: 1.4,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: DARK_BLUE,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  footerText: {
    color: WHITE,
    fontSize: 6,
  },
  footerBrand: {
    color: LIGHT_BLUE,
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
  },
});

// ─── Currency formatter ────────────────────────────────────────────────────────

function formatMXN(n: number): string {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── PDF Document ─────────────────────────────────────────────────────────────

function InvoiceDocument({ data }: { data: InvoiceData }): ReactElement<DocumentProps> {
  const { emisor, receptor, factura, conceptos, totales, sellos } = data;

  return React.createElement(
    Document,
    { title: `Factura ${factura.folioFiscalUUID}`, author: 'Tripoli Media' },
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },

      // ── Header ──
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(
          View,
          { style: styles.headerLeft },
          React.createElement(Text, { style: styles.companyName }, 'TRIPOLI MEDIA'),
          React.createElement(Text, { style: styles.companyTagline }, 'Publicidad · Marketing · Medios')
        ),
        React.createElement(
          View,
          { style: styles.headerRight },
          React.createElement(Text, { style: styles.invoiceLabel }, 'FACTURA'),
          React.createElement(Text, { style: styles.folioText }, factura.serieYFolio || factura.folioFiscalUUID?.slice(0, 8))
        )
      ),

      // ── Accent bar ──
      React.createElement(View, { style: styles.accentBar }),

      // ── Body ──
      React.createElement(
        View,
        { style: styles.body },

        // Emisor & Receptor side by side
        React.createElement(
          View,
          { style: styles.row2 },

          // Emisor
          React.createElement(
            View,
            { style: [styles.card, styles.col] },
            React.createElement(Text, { style: styles.cardTitle }, 'Datos del Emisor'),
            React.createElement(
              View,
              { style: styles.fieldRow },
              React.createElement(Text, { style: styles.fieldLabel }, 'RFC:'),
              React.createElement(Text, { style: styles.fieldValue }, emisor.rfc)
            ),
            React.createElement(
              View,
              { style: styles.fieldRow },
              React.createElement(Text, { style: styles.fieldLabel }, 'Nombre/Razón Social:'),
              React.createElement(Text, { style: styles.fieldValue }, emisor.nombre)
            ),
            React.createElement(
              View,
              { style: styles.fieldRow },
              React.createElement(Text, { style: styles.fieldLabel }, 'Régimen Fiscal:'),
              React.createElement(Text, { style: styles.fieldValue }, emisor.regimenFiscal)
            ),
            React.createElement(
              View,
              { style: styles.fieldRow },
              React.createElement(Text, { style: styles.fieldLabel }, 'Código Postal:'),
              React.createElement(Text, { style: styles.fieldValue }, emisor.codigoPostal)
            )
          ),

          // Receptor
          React.createElement(
            View,
            { style: [styles.card, styles.col] },
            React.createElement(Text, { style: styles.cardTitle }, 'Datos del Receptor'),
            React.createElement(
              View,
              { style: styles.fieldRow },
              React.createElement(Text, { style: styles.fieldLabel }, 'RFC:'),
              React.createElement(Text, { style: styles.fieldValue }, receptor.rfc)
            ),
            React.createElement(
              View,
              { style: styles.fieldRow },
              React.createElement(Text, { style: styles.fieldLabel }, 'Nombre/Razón Social:'),
              React.createElement(Text, { style: styles.fieldValue }, receptor.nombre)
            ),
            React.createElement(
              View,
              { style: styles.fieldRow },
              React.createElement(Text, { style: styles.fieldLabel }, 'Régimen Fiscal:'),
              React.createElement(Text, { style: styles.fieldValue }, receptor.regimenFiscal)
            ),
            React.createElement(
              View,
              { style: styles.fieldRow },
              React.createElement(Text, { style: styles.fieldLabel }, 'Código Postal:'),
              React.createElement(Text, { style: styles.fieldValue }, receptor.codigoPostal)
            ),
            React.createElement(
              View,
              { style: styles.fieldRow },
              React.createElement(Text, { style: styles.fieldLabel }, 'Uso CFDI:'),
              React.createElement(Text, { style: styles.fieldValue }, receptor.usoCFDI)
            )
          )
        ),

        // Factura details card (full width)
        React.createElement(
          View,
          { style: styles.card },
          React.createElement(Text, { style: styles.cardTitle }, 'Detalles de la Factura'),
          React.createElement(
            View,
            { style: styles.row2 },
            React.createElement(
              View,
              { style: styles.col },
              React.createElement(
                View,
                { style: styles.fieldRow },
                React.createElement(Text, { style: styles.fieldLabel }, 'Folio Fiscal (UUID):'),
                React.createElement(Text, { style: styles.fieldValue }, factura.folioFiscalUUID)
              ),
              React.createElement(
                View,
                { style: styles.fieldRow },
                React.createElement(Text, { style: styles.fieldLabel }, 'Serie y Folio:'),
                React.createElement(Text, { style: styles.fieldValue }, factura.serieYFolio)
              ),
              React.createElement(
                View,
                { style: styles.fieldRow },
                React.createElement(Text, { style: styles.fieldLabel }, 'Fecha de Emisión:'),
                React.createElement(Text, { style: styles.fieldValue }, factura.fechaEmision)
              )
            ),
            React.createElement(
              View,
              { style: styles.col },
              React.createElement(
                View,
                { style: styles.fieldRow },
                React.createElement(Text, { style: styles.fieldLabel }, 'Lugar de Expedición:'),
                React.createElement(Text, { style: styles.fieldValue }, factura.lugarExpedicion)
              ),
              React.createElement(
                View,
                { style: styles.fieldRow },
                React.createElement(Text, { style: styles.fieldLabel }, 'Forma de Pago:'),
                React.createElement(Text, { style: styles.fieldValue }, factura.formaPago)
              ),
              React.createElement(
                View,
                { style: styles.fieldRow },
                React.createElement(Text, { style: styles.fieldLabel }, 'Método de Pago:'),
                React.createElement(Text, { style: styles.fieldValue }, factura.metodoPago)
              )
            )
          )
        ),

        // Conceptos table
        React.createElement(
          View,
          { style: styles.table },
          // Header row
          React.createElement(
            View,
            { style: styles.tableHeader },
            React.createElement(Text, { style: [styles.tableHeaderCell, styles.colClave] }, 'Clave SAT'),
            React.createElement(Text, { style: [styles.tableHeaderCell, styles.colDesc] }, 'Descripción'),
            React.createElement(Text, { style: [styles.tableHeaderCell, styles.colCantidad] }, 'Cant.'),
            React.createElement(Text, { style: [styles.tableHeaderCell, styles.colUnidad] }, 'Unidad'),
            React.createElement(Text, { style: [styles.tableHeaderCell, styles.colValor] }, 'Valor Unit.'),
            React.createElement(Text, { style: [styles.tableHeaderCell, styles.colImporte] }, 'Importe')
          ),
          // Data rows
          ...conceptos.map((c, i) =>
            React.createElement(
              View,
              { key: i, style: [styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}] },
              React.createElement(Text, { style: [styles.tableCell, styles.colClave] }, c.claveSAT),
              React.createElement(Text, { style: [styles.tableCell, styles.colDesc] }, c.descripcion),
              React.createElement(Text, { style: [styles.tableCell, styles.colCantidad] }, String(c.cantidad)),
              React.createElement(Text, { style: [styles.tableCell, styles.colUnidad] }, c.unidad),
              React.createElement(Text, { style: [styles.tableCell, styles.colValor] }, formatMXN(c.valorUnitario)),
              React.createElement(Text, { style: [styles.tableCell, styles.colImporte] }, formatMXN(c.importe))
            )
          )
        ),

        // Totales
        React.createElement(
          View,
          { style: styles.totalesContainer },
          React.createElement(
            View,
            { style: styles.totalesCard },
            React.createElement(
              View,
              { style: styles.totalesRow },
              React.createElement(Text, { style: styles.totalesLabel }, 'Subtotal:'),
              React.createElement(Text, { style: styles.totalesValue }, formatMXN(totales.subtotal))
            ),
            React.createElement(
              View,
              { style: styles.totalesRow },
              React.createElement(Text, { style: styles.totalesLabel }, 'IVA (16%):'),
              React.createElement(Text, { style: styles.totalesValue }, formatMXN(totales.iva))
            ),
            React.createElement(
              View,
              { style: styles.totalFinalRow },
              React.createElement(Text, { style: styles.totalFinalLabel }, 'TOTAL:'),
              React.createElement(Text, { style: styles.totalFinalValue }, formatMXN(totales.total))
            ),
            React.createElement(Text, { style: styles.letrasText }, totales.montoConLetra)
          )
        ),

        // Sellos
        sellos.selloCFDI
          ? React.createElement(
              View,
              { style: styles.selloCard },
              React.createElement(Text, { style: styles.selloTitle }, 'Sello Digital del CFDI'),
              React.createElement(Text, { style: styles.selloText }, sellos.selloCFDI)
            )
          : null,
        sellos.selloSAT
          ? React.createElement(
              View,
              { style: styles.selloCard },
              React.createElement(Text, { style: styles.selloTitle }, 'Sello Digital del SAT'),
              React.createElement(Text, { style: styles.selloText }, sellos.selloSAT)
            )
          : null,
        sellos.cadenaOriginal
          ? React.createElement(
              View,
              { style: styles.selloCard },
              React.createElement(Text, { style: styles.selloTitle }, 'Cadena Original del Complemento de Certificación Digital del SAT'),
              React.createElement(Text, { style: styles.selloText }, sellos.cadenaOriginal)
            )
          : null
      ),

      // ── Footer ──
      React.createElement(
        View,
        { style: styles.footer, fixed: true },
        React.createElement(Text, { style: styles.footerText }, 'Este documento es una representación impresa de un CFDI · www.tripoli.media'),
        React.createElement(Text, { style: styles.footerBrand }, 'TRIPOLI MEDIA')
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
