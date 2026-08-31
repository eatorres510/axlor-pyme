import React from "react";
import { Printer, CheckCircle2, FileText } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

export interface TransferVoucherLine {
  productId: number;
  productCode: string;
  productName: string;
  categoryName?: string;
  qty: number;
  uomCode?: string;
}

export interface TransferVoucherData {
  voucherNumber: string;
  companyName: string;
  companyTaxId?: string;
  date: string;
  fromWarehouseName: string;
  fromWarehouseCode?: string;
  toWarehouseName: string;
  toWarehouseCode?: string;
  description?: string;
  lines: TransferVoucherLine[];
  totalUnits: number;
  createdBy?: string;
}

interface TransferVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  voucherData: TransferVoucherData | null;
}

export const TransferVoucherModal: React.FC<TransferVoucherModalProps> = ({
  isOpen,
  onClose,
  voucherData,
}) => {
  if (!voucherData) return null;

  // 1. Impresión en Formato Carta / Remisión Formal (A4 / Carta)
  const handlePrintStandard = () => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    const tableRows = voucherData.lines
      .map(
        (item, index) => `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
          <td style="padding: 6px 8px; text-align: center; color: #64748b; font-family: monospace;">${index + 1}</td>
          <td style="padding: 6px 8px; font-family: monospace; font-weight: bold; color: #1e3a8a;">${item.productCode || "SKU-" + item.productId}</td>
          <td style="padding: 6px 8px; font-weight: 600; color: #0f172a;">${item.productName}</td>
          <td style="padding: 6px 8px; color: #64748b;">${item.categoryName || "General"}</td>
          <td style="padding: 6px 8px; text-align: right; font-weight: bold; font-family: monospace; font-size: 12px; color: #0f172a;">${item.qty}</td>
          <td style="padding: 6px 8px; text-align: center; color: #64748b; font-family: monospace;">${item.uomCode || "PZA"}</td>
        </tr>`
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Vale de Traslado #${voucherData.voucherNumber}</title>
          <style>
            @page {
              size: letter portrait;
              margin: 12mm 15mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              background: #fff;
              font-size: 12px;
              line-height: 1.4;
            }
            .header-table {
              width: 100%;
              border-bottom: 2px solid #1e3a8a;
              padding-bottom: 12px;
              margin-bottom: 15px;
            }
            .company-title {
              font-size: 18px;
              font-weight: 800;
              color: #0f172a;
              text-transform: uppercase;
              letter-spacing: -0.5px;
            }
            .doc-badge {
              text-align: right;
            }
            .doc-title {
              font-size: 14px;
              font-weight: 800;
              color: #1e3a8a;
              text-transform: uppercase;
            }
            .doc-folio {
              font-size: 16px;
              font-weight: 900;
              font-family: monospace;
              color: #0f172a;
              margin-top: 2px;
            }
            .info-grid {
              width: 100%;
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              margin-bottom: 15px;
              border-collapse: collapse;
            }
            .info-cell {
              padding: 8px 12px;
              vertical-align: top;
              border-right: 1px solid #cbd5e1;
              font-size: 11px;
            }
            .info-cell:last-child {
              border-right: none;
            }
            .info-label {
              font-size: 9px;
              font-weight: bold;
              text-transform: uppercase;
              color: #64748b;
              margin-bottom: 3px;
              display: block;
            }
            .info-val {
              font-weight: 700;
              color: #0f172a;
              font-size: 12px;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              overflow: hidden;
            }
            .items-table th {
              background: #f1f5f9;
              color: #475569;
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              padding: 8px;
              border-bottom: 1px solid #cbd5e1;
              text-align: left;
            }
            .summary-box {
              display: flex;
              justify-content: space-between;
              align-items: center;
              background: #f8fafc;
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              padding: 10px 14px;
              margin-bottom: 35px;
            }
            .signatures-table {
              width: 100%;
              margin-top: 20px;
              border-collapse: collapse;
            }
            .signature-box {
              width: 32%;
              border: 1px dashed #94a3b8;
              border-radius: 6px;
              padding: 10px;
              text-align: center;
              font-size: 10px;
              vertical-align: top;
            }
            .sig-line {
              margin-top: 50px;
              border-top: 1px solid #0f172a;
              padding-top: 4px;
              font-weight: bold;
              color: #0f172a;
            }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td>
                <h1 class="company-title">${voucherData.companyName}</h1>
                ${voucherData.companyTaxId ? `<p style="font-size: 11px; color: #475569; font-weight: 600;">RFC: ${voucherData.companyTaxId}</p>` : ""}
                <p style="font-size: 10px; color: #64748b;">Sistema Central de Control de Almacenes & Kardex</p>
              </td>
              <td class="doc-badge">
                <div class="doc-title">VALE DE TRASLADO INTERNO</div>
                <div class="doc-folio">FOLIO: ${voucherData.voucherNumber}</div>
                <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Fecha/Hora: ${voucherData.date}</div>
              </td>
            </tr>
          </table>

          <table class="info-grid">
            <tr>
              <td class="info-cell" style="width: 50%; background: #fff1f2;">
                <span class="info-label" style="color: #be123c;">📤 ALMACÉN DE SALIDA (ORIGEN)</span>
                <span class="info-val" style="color: #9f1239;">${voucherData.fromWarehouseName}</span>
                <span style="font-size: 10px; color: #be123c; display: block; margin-top: 2px;">Código: ${voucherData.fromWarehouseCode || "BOD-ORIGEN"}</span>
              </td>
              <td class="info-cell" style="width: 50%; background: #f0fdf4;">
                <span class="info-label" style="color: #15803d;">📥 ALMACÉN DE ENTRADA (DESTINO)</span>
                <span class="info-val" style="color: #166534;">${voucherData.toWarehouseName}</span>
                <span style="font-size: 10px; color: #15803d; display: block; margin-top: 2px;">Código: ${voucherData.toWarehouseCode || "BOD-DESTINO"}</span>
              </td>
            </tr>
            <tr>
              <td colspan="2" class="info-cell" style="background: #fafafa;">
                <span class="info-label">MOTIVO / JUSTIFICACIÓN DEL TRASLADO:</span>
                <span style="font-size: 11px; font-weight: 600; color: #334155;">${voucherData.description || "Reabastecimiento y traspaso de mercancía entre bodegas"}</span>
              </td>
            </tr>
          </table>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 35px; text-align: center;">#</th>
                <th style="width: 130px;">SKU / Código</th>
                <th>Descripción del Producto</th>
                <th style="width: 110px;">Categoría</th>
                <th style="width: 70px; text-align: right;">Cantidad</th>
                <th style="width: 50px; text-align: center;">U.M.</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>

          <div class="summary-box">
            <div style="font-size: 11px; color: #64748b;">
              Total de Partidas Trasladadas: <strong style="color: #0f172a;">${voucherData.lines.length}</strong>
            </div>
            <div style="font-size: 13px; font-weight: 800; color: #1e3a8a;">
              TOTAL UNIDADES TRASLADADAS: <span style="font-family: monospace; font-size: 15px;">${voucherData.totalUnits} PZA</span>
            </div>
          </div>

          <table class="signatures-table">
            <tr>
              <td class="signature-box">
                <span style="font-weight: bold; color: #9f1239; font-size: 10px; text-transform: uppercase;">1. Entregado / Despachado</span>
                <p style="font-size: 9px; color: #64748b; margin-top: 2px;">Responsable Bodega Origen</p>
                <div class="sig-line">Nombre, Firma & Fecha</div>
              </td>
              <td style="width: 2%;"></td>
              <td class="signature-box">
                <span style="font-weight: bold; color: #1e3a8a; font-size: 10px; text-transform: uppercase;">2. Transportado / Custodia</span>
                <p style="font-size: 9px; color: #64748b; margin-top: 2px;">Chofer / Chofer de Traspaso</p>
                <div class="sig-line">Nombre del Chofer / Placas</div>
              </td>
              <td style="width: 2%;"></td>
              <td class="signature-box">
                <span style="font-weight: bold; color: #166534; font-size: 10px; text-transform: uppercase;">3. Recibido a Conformidad</span>
                <p style="font-size: 9px; color: #64748b; margin-top: 2px;">Responsable Bodega Destino</p>
                <div class="sig-line">Nombre, Firma & Sello</div>
              </td>
            </tr>
          </table>

          <div style="text-align: center; margin-top: 30px; font-size: 9px; color: #94a3b8;">
            Comprobante de movimiento interno de inventario. Conserve este documento firmado para auditorías contables y de kardex físico.
          </div>
        </body>
      </html>
    `;

    doc.open();
    doc.write(html);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1500);
    }, 200);
  };

  // 2. Impresión en Formato Térmico (80mm)
  const handlePrintThermal = () => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    const itemsHtml = voucherData.lines
      .map(
        (item) => `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; font-size: 11px;">
          <div style="flex: 1; padding-right: 6px;">
            <span style="font-weight: bold;">[${item.productCode || "SKU"}]</span> ${item.productName}
          </div>
          <span style="font-weight: bold; font-family: monospace; white-space: nowrap;">${item.qty} ${item.uomCode || "PZA"}</span>
        </div>`
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Vale Traslado #${voucherData.voucherNumber}</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: 11px;
              color: #000;
              background: #fff;
              width: 72mm;
              max-width: 72mm;
              margin: 0 auto;
              padding: 6px 2px;
              line-height: 1.25;
            }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 6px 0; }
            .header h3 { font-size: 12px; font-weight: bold; text-transform: uppercase; }
            .sig-box { margin-top: 25px; border-top: 1px solid #000; text-align: center; font-size: 9px; padding-top: 2px; }
          </style>
        </head>
        <body>
          <div class="header text-center">
            <h3>${voucherData.companyName}</h3>
            ${voucherData.companyTaxId ? `<p style="font-size: 10px;">RFC: ${voucherData.companyTaxId}</p>` : ""}
            <p style="font-size: 11px; font-weight: bold; margin-top: 4px;">VALE DE TRASLADO INTERNO</p>
            <p style="font-size: 11px; font-weight: bold;">#${voucherData.voucherNumber}</p>
            <p style="font-size: 9px;">${voucherData.date}</p>
          </div>

          <div class="divider"></div>

          <div style="font-size: 10px;">
            <div><strong>ORIGEN:</strong> ${voucherData.fromWarehouseName}</div>
            <div><strong>DESTINO:</strong> ${voucherData.toWarehouseName}</div>
            ${voucherData.description ? `<div style="margin-top: 2px; font-size: 9px;"><strong>MOTIVO:</strong> ${voucherData.description}</div>` : ""}
          </div>

          <div class="divider"></div>

          <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: bold;">
            <span>ARTÍCULO</span>
            <span>CANTIDAD</span>
          </div>

          <div style="margin-top: 4px;">${itemsHtml}</div>

          <div class="divider"></div>

          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 12px;">
            <span>TOTAL UNIDADES:</span>
            <span>${voucherData.totalUnits} PZA</span>
          </div>

          <div class="divider"></div>

          <div class="sig-box">
            Firma Entrega (Origen)
          </div>

          <div class="sig-box">
            Firma Recepción (Destino)
          </div>
        </body>
      </html>
    `;

    doc.open();
    doc.write(html);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1500);
    }, 200);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Comprobante / Vale de Traslado de Mercancía" maxWidth="lg">
      <div className="space-y-4">
        {/* Document Preview Card */}
        <div className="bg-slate-50 dark:bg-[#071C33] p-5 rounded-2xl border border-slate-200 dark:border-white/10 space-y-4 text-xs">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase">
                  {voucherData.companyName}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Vale de Traspaso de Mercancía entre Almacenes • {voucherData.date}
                </p>
              </div>
            </div>

            <div className="text-right sm:text-right">
              <span className="font-mono text-xs font-bold text-etiserv-blue bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-900/50 block">
                FOLIO: {voucherData.voucherNumber}
              </span>
            </div>
          </div>

          {/* Bodegas Origen & Destino */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40">
              <span className="text-[10px] font-bold uppercase text-rose-700 dark:text-rose-400 block mb-1">
                📤 Almacén de Salida (Origen)
              </span>
              <div className="font-bold text-slate-900 dark:text-white text-xs">
                {voucherData.fromWarehouseName}
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                {voucherData.fromWarehouseCode || "BOD-ORIGEN"}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
              <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 block mb-1">
                📥 Almacén de Entrada (Destino)
              </span>
              <div className="font-bold text-slate-900 dark:text-white text-xs">
                {voucherData.toWarehouseName}
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                {voucherData.toWarehouseCode || "BOD-DESTINO"}
              </span>
            </div>
          </div>

          {/* Motivo */}
          <div className="p-2.5 rounded-lg bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10">
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
              Motivo / Referencia:
            </span>
            <p className="text-xs text-slate-700 dark:text-slate-200 font-medium">
              {voucherData.description || "Reabastecimiento y traspaso de mercancía entre bodegas"}
            </p>
          </div>

          {/* Table of items */}
          <div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white dark:bg-white/[0.02]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/70 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2 px-3">#</th>
                  <th className="py-2 px-3">SKU / Código</th>
                  <th className="py-2 px-3">Producto</th>
                  <th className="py-2 px-3 text-right">Cantidad</th>
                  <th className="py-2 px-3 text-center">U.M.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-medium">
                {voucherData.lines.map((l, i) => (
                  <tr key={i}>
                    <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{i + 1}</td>
                    <td className="py-2 px-3 font-mono font-bold text-etiserv-blue">{l.productCode}</td>
                    <td className="py-2 px-3 text-slate-900 dark:text-white font-semibold">{l.productName}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">{l.qty}</td>
                    <td className="py-2 px-3 text-center font-mono text-slate-500">{l.uomCode || "PZA"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total units banner */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50">
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              Total de Partidas: <strong className="font-bold">{voucherData.lines.length}</strong>
            </span>
            <span className="font-bold text-etiserv-blue font-mono text-sm">
              Total Piezas: {voucherData.totalUnits} PZA
            </span>
          </div>

          {/* Firmas Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
            <div className="p-2.5 rounded-lg border border-dashed border-slate-300 dark:border-white/20 text-center">
              <span className="text-[9px] font-bold uppercase text-slate-400 block mb-3">1. Despachado (Origen)</span>
              <div className="border-t border-slate-300 dark:border-white/20 pt-1 text-[10px] text-slate-500">Firma y Fecha</div>
            </div>
            <div className="p-2.5 rounded-lg border border-dashed border-slate-300 dark:border-white/20 text-center">
              <span className="text-[9px] font-bold uppercase text-slate-400 block mb-3">2. Chofer / Tránsito</span>
              <div className="border-t border-slate-300 dark:border-white/20 pt-1 text-[10px] text-slate-500">Nombre y Firma</div>
            </div>
            <div className="p-2.5 rounded-lg border border-dashed border-slate-300 dark:border-white/20 text-center">
              <span className="text-[9px] font-bold uppercase text-slate-400 block mb-3">3. Recibido (Destino)</span>
              <div className="border-t border-slate-300 dark:border-white/20 pt-1 text-[10px] text-slate-500">Firma y Sello</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePrintThermal}
            className="gap-1.5 font-semibold text-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Ticket Térmico (80mm)</span>
          </Button>
          <Button
            variant="primary"
            glow
            size="sm"
            onClick={handlePrintStandard}
            className="gap-1.5 font-semibold text-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Imprimir Vale / Remisión (Carta / A4)</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
