import React from "react";
import {
  FileText,
  Receipt,
  CreditCard,
  Printer,
  Building2,
  User,
  Layers,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { StatementMovement } from "../../api/financeApi";
import { Modal } from "../ui/Modal";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

interface DocumentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  movement: StatementMovement | null;
  partnerName?: string;
  partnerTaxId?: string;
  companyName?: string;
  companyTaxId?: string;
  currencySymbol?: string;
}

export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  isOpen,
  onClose,
  movement,
  partnerName = "Cliente Comercial",
  partnerTaxId = "XAXX010101000",
  companyName = "Distribuidora Nacional PyME S.A.",
  companyTaxId = "DNP180520AB1",
  currencySymbol = "$",
}) => {
  if (!movement) return null;

  const isInvoice = movement.type === "INVOICE";
  const isPayment = movement.type === "PAYMENT";
  const isCreditNote = movement.type === "CREDIT_NOTE";

  const totalAmount = movement.debit > 0 ? movement.debit : movement.credit;
  const subtotal = movement.subtotal ?? Number((totalAmount / 1.16).toFixed(2));
  const taxAmount = movement.taxAmount ?? Number((totalAmount - subtotal).toFixed(2));

  const handlePrint = () => {
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

    const docTypeName = isInvoice
      ? "FACTURA COMERCIAL / CFDI"
      : isPayment
      ? "PÓLIZA / RECIBO DE PAGO"
      : "NOTA DE CRÉDITO / DEVOLUCIÓN";

    const linesHtml = movement.lines && movement.lines.length > 0
      ? movement.lines.map((l) => `
        <tr>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${l.productCode || "PROD"}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0;">${l.description}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">${l.qty || 1}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace;">$${(l.unitPrice || totalAmount).toFixed(2)}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace; font-weight: bold;">$${(l.total || totalAmount).toFixed(2)}</td>
        </tr>
      `).join("")
      : `
        <tr>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">DOC-01</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0;">${movement.concept}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">1</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace;">$${subtotal.toFixed(2)}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace; font-weight: bold;">$${totalAmount.toFixed(2)}</td>
        </tr>
      `;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${docTypeName} - ${movement.docNumber}</title>
          <style>
            @page { size: letter portrait; margin: 15mm; }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              background: #fff;
              font-size: 11px;
              line-height: 1.4;
            }
            .header-table { width: 100%; border-bottom: 2px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 15px; }
            .company-title { font-size: 18px; font-weight: 800; text-transform: uppercase; color: #0f172a; }
            .doc-title { font-size: 14px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; text-align: right; }
            .doc-folio { font-size: 16px; font-weight: 900; font-family: monospace; text-align: right; margin-top: 2px; }
            .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; border: 1px solid #cbd5e1; border-radius: 6px; }
            .meta-cell { padding: 8px 12px; border: 1px solid #cbd5e1; vertical-align: top; width: 50%; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 18px; border: 1px solid #cbd5e1; border-radius: 6px; }
            .items-table th { background: #f8fafc; padding: 8px; font-weight: bold; text-align: left; text-transform: uppercase; font-size: 10px; border-bottom: 1px solid #cbd5e1; }
            .totals-table { width: 40%; margin-left: auto; border-collapse: collapse; margin-bottom: 25px; }
            .totals-table td { padding: 4px 8px; text-align: right; font-size: 11px; }
            .signatures-table { width: 100%; border-collapse: collapse; margin-top: 30px; }
            .signature-box { width: 45%; border: 1px dashed #94a3b8; border-radius: 6px; padding: 12px; text-align: center; font-size: 10px; vertical-align: top; }
            .sig-line { margin-top: 45px; border-top: 1px solid #0f172a; padding-top: 4px; font-weight: bold; }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td>
                <h1 class="company-title">${companyName}</h1>
                <p style="font-size: 11px; color: #475569; font-weight: 600;">RFC: ${companyTaxId}</p>
                <p style="font-size: 10px; color: #64748b;">Comprobante Oficial de Tesorería & Finanzas</p>
              </td>
              <td>
                <div class="doc-title">${docTypeName}</div>
                <div class="doc-folio">FOLIO: ${movement.docNumber}</div>
                <div style="font-size: 10px; color: #64748b; text-align: right; margin-top: 2px;">Fecha: ${movement.date}</div>
              </td>
            </tr>
          </table>

          <table class="meta-table">
            <tr>
              <td class="meta-cell">
                <span style="font-size: 9px; font-weight: bold; color: #64748b; text-transform: uppercase; display: block;">TERCERO / CLIENTE / PROVEEDOR:</span>
                <strong style="font-size: 12px; color: #1e3a8a;">${partnerName}</strong>
                <span style="font-size: 10px; color: #64748b; display: block;">RFC: ${partnerTaxId}</span>
              </td>
              <td class="meta-cell">
                <span style="font-size: 9px; font-weight: bold; color: #64748b; text-transform: uppercase; display: block;">CONCEPTO & FORMA DE PAGO:</span>
                <strong>${movement.concept}</strong>
                <span style="font-size: 10px; color: #64748b; display: block;">Método: ${movement.paymentMethod || "Transferencia / SPEI"}</span>
              </td>
            </tr>
          </table>

          <table class="items-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Descripción</th>
                <th style="text-align: center;">Cant.</th>
                <th style="text-align: right;">Precio Unit.</th>
                <th style="text-align: right;">Importe</th>
              </tr>
            </thead>
            <tbody>
              ${linesHtml}
            </tbody>
          </table>

          <table class="totals-table">
            <tr>
              <td style="color: #64748b;">Subtotal:</td>
              <td style="font-family: monospace; font-weight: bold;">$${subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="color: #64748b;">IVA (16%):</td>
              <td style="font-family: monospace; font-weight: bold;">$${taxAmount.toFixed(2)}</td>
            </tr>
            <tr style="border-top: 2px solid #0f172a; font-size: 13px;">
              <td style="font-weight: bold;">TOTAL:</td>
              <td style="font-family: monospace; font-weight: 900; color: #1e3a8a;">$${totalAmount.toFixed(2)}</td>
            </tr>
          </table>

          <div style="font-size: 10px; color: #64748b; padding: 6px 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 25px;">
            <strong>Asiento Contable:</strong> ${movement.accountingMove || `MOVE #${movement.id}`} • Estatus Registrado y Auditado en Axelor ERP.
          </div>

          <table class="signatures-table">
            <tr>
              <td class="signature-box">
                <span style="font-weight: bold; color: #1e3a8a; font-size: 10px; text-transform: uppercase;">Por la Empresa / Caja</span>
                <p style="font-size: 9px; color: #64748b; margin-top: 2px;">Elaboró / Autorizó</p>
                <div class="sig-line">Nombre y Firma Autorizada</div>
              </td>
              <td style="width: 10%;"></td>
              <td class="signature-box">
                <span style="font-weight: bold; color: #15803d; font-size: 10px; text-transform: uppercase;">Receptor / Conformidad</span>
                <p style="font-size: 9px; color: #64748b; margin-top: 2px;">Firma de Conformidad</p>
                <div class="sig-line">${partnerName}</div>
              </td>
            </tr>
          </table>
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
    <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth="lg">
      <div className="space-y-5 -mt-4">
        {/* Document Header Card */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#061527] border border-slate-200/60 dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold shadow-sm ${
                isInvoice
                  ? "bg-blue-500/10 text-etiserv-blue"
                  : isPayment
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-purple-500/10 text-purple-500"
              }`}
            >
              {isInvoice && <FileText className="w-5 h-5" />}
              {isPayment && <Receipt className="w-5 h-5" />}
              {isCreditNote && <CreditCard className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  {movement.docNumber}
                </span>
                <Badge
                  variant={
                    isInvoice ? "primary" : isPayment ? "success" : "neutral"
                  }
                  className="text-[10px]"
                >
                  {isInvoice && "Factura Comercial / Ingreso"}
                  {isPayment && "Recibo de Pago / SPEI"}
                  {isCreditNote && "Nota de Crédito / Devolución"}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {movement.concept}
              </p>
            </div>
          </div>

          <div className="text-right flex sm:flex-col items-center sm:items-end justify-between gap-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Documento</span>
            <span
              className={`text-xl font-heading font-bold font-mono tabular-nums ${
                isInvoice
                  ? "text-slate-900 dark:text-white"
                  : isPayment
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-purple-600 dark:text-purple-400"
              }`}
            >
              {isPayment || isCreditNote ? `-${currencySymbol}` : currencySymbol}
              {totalAmount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Emisor y Receptor Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          {/* Emisor */}
          <div className="p-3.5 rounded-xl border border-slate-100 dark:border-white/[0.04] bg-white dark:bg-[#071C33]">
            <div className="flex items-center gap-1.5 text-slate-400 uppercase text-[10px] font-bold tracking-wider mb-2">
              <Building2 className="w-3.5 h-3.5 text-etiserv-blue" />
              <span>Emisor (Empresa)</span>
            </div>
            <div className="font-semibold text-slate-900 dark:text-white">{companyName}</div>
            <div className="font-mono text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
              RFC: {companyTaxId}
            </div>
            <div className="text-slate-400 text-[11px] mt-0.5">Régimen: 601 - General de Ley PM</div>
          </div>

          {/* Receptor / Socio */}
          <div className="p-3.5 rounded-xl border border-slate-100 dark:border-white/[0.04] bg-white dark:bg-[#071C33]">
            <div className="flex items-center gap-1.5 text-slate-400 uppercase text-[10px] font-bold tracking-wider mb-2">
              <User className="w-3.5 h-3.5 text-emerald-500" />
              <span>Cliente / Receptor</span>
            </div>
            <div className="font-semibold text-slate-900 dark:text-white">{partnerName}</div>
            <div className="font-mono text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
              RFC: {partnerTaxId}
            </div>
            <div className="text-slate-400 text-[11px] mt-0.5">Uso CFDI: G03 - Gastos en General</div>
          </div>
        </div>

        {/* Dates & Method Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-lg bg-slate-50 dark:bg-[#061527] text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Fecha Emisión</span>
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{movement.date}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Vencimiento</span>
            <span
              className={`font-mono font-semibold ${
                movement.isOverdue ? "text-rose-600 dark:text-rose-400 font-bold" : "text-slate-800 dark:text-slate-200"
              }`}
            >
              {movement.dueDate || "Inmediato"}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Forma / Método</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
              {movement.paymentMethod || (isInvoice ? "Crédito (PPD)" : "Transferencia SPEI")}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Estado</span>
            {movement.isOverdue ? (
              <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1 text-[11px]">
                <AlertTriangle className="w-3 h-3" /> Vencido
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                <ShieldCheck className="w-3 h-3" /> Al Corriente
              </span>
            )}
          </div>
        </div>

        {/* Line Items Table (Partidas) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-etiserv-blue" />
              {isPayment ? "Detalle del Pago & Aplicación" : "Partidas del Documento"}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {movement.lines?.length || 1} {movement.lines?.length === 1 ? "concepto" : "conceptos"}
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#061527] text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-white/10">
                <tr>
                  <th className="py-2 px-3">Código</th>
                  <th className="py-2 px-3">Descripción / Concepto</th>
                  <th className="py-2 px-3 text-center">Cant.</th>
                  <th className="py-2 px-3 text-center">UoM</th>
                  <th className="py-2 px-3 text-right">P. Unitario</th>
                  <th className="py-2 px-3 text-right">Importe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {movement.lines && movement.lines.length > 0 ? (
                  movement.lines.map((line, lIdx) => (
                    <tr key={line.id || lIdx} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                      <td className="py-2.5 px-3 font-mono font-bold text-etiserv-blue text-[11px]">
                        {line.productCode || "PROD"}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                        {line.description}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                        {typeof line.uom === 'object' ? ((line.uom as any)?.code || (line.uom as any)?.name || "PZA") : (line.uom || "PZA")}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        {currencySymbol}
                        {line.unitPrice.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                        {currencySymbol}
                        {line.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-2.5 px-3 font-mono font-bold text-etiserv-blue text-[11px]">DOC-01</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                      {movement.concept}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold">1</td>
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono">SER</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      {currencySymbol}
                      {subtotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                      {currencySymbol}
                      {totalAmount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals & Accounting Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
          {/* Accounting Entry Box */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#061527] border border-slate-200/60 dark:border-white/[0.06] text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Asiento Contable Relacionado
            </span>
            <div className="font-mono text-xs font-semibold text-etiserv-blue">
              {movement.accountingMove || `MOVE #${movement.id} (Póliza Diario)`}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Afectación automática a Libro Diario y Mayor con estatus verificado.
            </p>
          </div>

          {/* Financial Totals */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#061527] border border-slate-200/60 dark:border-white/[0.06] space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                {currencySymbol}
                {subtotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>IVA Trasladado (16%):</span>
              <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                {currencySymbol}
                {taxAmount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1.5 border-t border-slate-200 dark:border-white/10 text-sm">
              <span>Total Documento:</span>
              <span className="font-mono tabular-nums text-etiserv-blue">
                {currencySymbol}
                {totalAmount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/10">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 text-xs font-semibold">
            <Printer className="w-3.5 h-3.5" /> Imprimir Documento
          </Button>
          <Button variant="primary" size="sm" onClick={onClose} className="px-5 text-xs font-semibold">
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
