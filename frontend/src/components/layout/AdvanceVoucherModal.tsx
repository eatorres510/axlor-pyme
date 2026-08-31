import React from "react";
import { Printer, CheckCircle2, FileText, Coins } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

export interface AdvanceVoucherData {
  voucherNumber: string;
  companyName: string;
  companyTaxId?: string;
  date: string;
  employeeName: string;
  employeeTaxId?: string;
  employeeCode?: string;
  jobTitle?: string;
  amount: number;
  paymentMethod: string;
  notes?: string;
}

interface AdvanceVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  voucherData: AdvanceVoucherData | null;
}

export const AdvanceVoucherModal: React.FC<AdvanceVoucherModalProps> = ({
  isOpen,
  onClose,
  voucherData,
}) => {
  if (!voucherData) return null;

  // 1. Impresión en Formato Carta Formal
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

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Vale de Anticipo #${voucherData.voucherNumber}</title>
          <style>
            @page {
              size: letter portrait;
              margin: 15mm 20mm;
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
            }
            .doc-title {
              font-size: 14px;
              font-weight: 800;
              color: #1e3a8a;
              text-transform: uppercase;
              text-align: right;
            }
            .doc-folio {
              font-size: 16px;
              font-weight: 900;
              font-family: monospace;
              color: #0f172a;
              text-align: right;
              margin-top: 2px;
            }
            .card-box {
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              padding: 14px;
              margin-bottom: 18px;
              background: #f8fafc;
            }
            .amount-banner {
              background: #fffbeb;
              border: 2px solid #f59e0b;
              border-radius: 8px;
              padding: 12px 18px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 20px;
            }
            .legal-text {
              font-size: 10px;
              color: #64748b;
              text-align: justify;
              line-height: 1.4;
              border: 1px dashed #cbd5e1;
              border-radius: 6px;
              padding: 10px;
              margin-bottom: 30px;
              background: #fafafa;
            }
            .signatures-table {
              width: 100%;
              border-collapse: collapse;
            }
            .signature-box {
              width: 46%;
              border: 1px dashed #94a3b8;
              border-radius: 6px;
              padding: 12px;
              text-align: center;
              font-size: 11px;
              vertical-align: top;
            }
            .sig-line {
              margin-top: 50px;
              border-top: 1px solid #0f172a;
              padding-top: 4px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td>
                <h1 class="company-title">${voucherData.companyName}</h1>
                ${voucherData.companyTaxId ? `<p style="font-size: 11px; color: #475569; font-weight: 600;">RFC: ${voucherData.companyTaxId}</p>` : ""}
                <p style="font-size: 10px; color: #64748b;">Control de Anticipos & Préstamos a Empleados</p>
              </td>
              <td>
                <div class="doc-title">VALE DE ANTICIPO DE SUELDO</div>
                <div class="doc-folio">FOLIO: ${voucherData.voucherNumber}</div>
                <div style="font-size: 10px; color: #64748b; text-align: right; margin-top: 2px;">Fecha: ${voucherData.date}</div>
              </td>
            </tr>
          </table>

          <div class="card-box">
            <table style="width: 100%; font-size: 11px;">
              <tr>
                <td style="width: 50%; padding: 4px;">
                  <span style="font-size: 9px; font-weight: bold; color: #64748b; text-transform: uppercase;">COLABORADOR / SOLICITANTE:</span>
                  <div style="font-size: 13px; font-weight: bold; color: #1e3a8a; margin-top: 2px;">${voucherData.employeeName}</div>
                  <span style="font-size: 10px; color: #64748b;">RFC: ${voucherData.employeeTaxId || "XAXX010101000"} • ${voucherData.jobTitle || "Colaborador General"}</span>
                </td>
                <td style="width: 50%; padding: 4px;">
                  <span style="font-size: 9px; font-weight: bold; color: #64748b; text-transform: uppercase;">FORMA DE ENTREGA:</span>
                  <div style="font-size: 12px; font-weight: bold; color: #0f172a; margin-top: 2px;">${voucherData.paymentMethod === "CASH" ? "Efectivo en Caja Chica" : "Transferencia / Depósito Bancario"}</div>
                  <span style="font-size: 10px; color: #64748b;">Motivo: ${voucherData.notes || "Anticipo de nómina quincenal"}</span>
                </td>
              </tr>
            </table>
          </div>

          <div class="amount-banner">
            <div>
              <span style="font-size: 10px; font-weight: bold; color: #92400e; text-transform: uppercase; display: block;">MONTO ENTREGADO EN CALIDAD DE ANTICIPO:</span>
              <span style="font-size: 11px; color: #78350f;">A ser amortizado en la nómina inmediata siguiente</span>
            </div>
            <div style="font-size: 22px; font-weight: 900; font-family: monospace; color: #b45309;">
              $${voucherData.amount.toFixed(2)} M.N.
            </div>
          </div>

          <div class="legal-text">
            <strong>AUTORIZACIÓN EXPRESA DE DESCUENTO:</strong> Por medio del presente documento, reconozco haber recibido de la empresa la cantidad señalada en calidad de anticipo a cuenta de mis salarios devengados o por devengar. Asimismo, autorizo de manera expresa y voluntaria a la empresa para que dicho importe sea descontado y amortizado en su totalidad en la nómina del periodo correspondiente.
          </div>

          <table class="signatures-table">
            <tr>
              <td class="signature-box">
                <span style="font-weight: bold; color: #1e3a8a; font-size: 10px; text-transform: uppercase;">Por la Empresa / Caja</span>
                <p style="font-size: 9px; color: #64748b; margin-top: 2px;">Entregó Recursos</p>
                <div class="sig-line">Nombre y Firma de Caja</div>
              </td>
              <td style="width: 8%;"></td>
              <td class="signature-box">
                <span style="font-weight: bold; color: #b45309; font-size: 10px; text-transform: uppercase;">Empleado Solicitante</span>
                <p style="font-size: 9px; color: #64748b; margin-top: 2px;">Recibí de Conformidad</p>
                <div class="sig-line">${voucherData.employeeName}</div>
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

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Vale Anticipo #${voucherData.voucherNumber}</title>
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
            .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
            .header h3 { font-size: 12px; font-weight: bold; text-transform: uppercase; }
            .sig-box { margin-top: 30px; border-top: 1px solid #000; text-align: center; font-size: 9px; padding-top: 2px; }
          </style>
        </head>
        <body>
          <div class="header text-center">
            <h3>${voucherData.companyName}</h3>
            ${voucherData.companyTaxId ? `<p style="font-size: 10px;">RFC: ${voucherData.companyTaxId}</p>` : ""}
            <p style="font-size: 11px; font-weight: bold; margin-top: 4px;">VALE DE ANTICIPO DE SUELDO</p>
            <p style="font-size: 11px; font-weight: bold;">#${voucherData.voucherNumber}</p>
            <p style="font-size: 9px;">${voucherData.date}</p>
          </div>

          <div class="divider"></div>

          <div style="font-size: 10px;">
            <div><strong>EMPLEADO:</strong> ${voucherData.employeeName}</div>
            <div><strong>RFC:</strong> ${voucherData.employeeTaxId || "XAXX010101000"}</div>
            <div><strong>PUESTO:</strong> ${voucherData.jobTitle || "General"}</div>
            <div><strong>FORMA:</strong> ${voucherData.paymentMethod}</div>
          </div>

          <div class="divider"></div>

          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 13px;">
            <span>TOTAL ANTICIPO:</span>
            <span>$${voucherData.amount.toFixed(2)}</span>
          </div>

          <div class="divider"></div>

          <p style="font-size: 8px; text-align: justify; margin-top: 4px;">
            Autorizo el descuento de este anticipo en la nómina inmediata siguiente.
          </p>

          <div class="sig-box">
            Firma del Empleado<br/>
            ${voucherData.employeeName}
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
    <Modal isOpen={isOpen} onClose={onClose} title="Vale de Anticipo de Sueldo" maxWidth="md">
      <div className="space-y-4">
        {/* Preview Card */}
        <div className="bg-slate-50 dark:bg-[#071C33] p-5 rounded-2xl border border-slate-200 dark:border-white/10 space-y-4 text-xs">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase">
                  {voucherData.companyName}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Vale de Préstamo / Anticipo de Nómina • {voucherData.date}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="font-mono text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-900/50 block">
                FOLIO: {voucherData.voucherNumber}
              </span>
            </div>
          </div>

          {/* Empleado Info */}
          <div className="p-3 rounded-xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Colaborador:</span>
              <strong className="text-slate-900 dark:text-white font-bold">{voucherData.employeeName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Puesto:</span>
              <span className="text-slate-700 dark:text-slate-300 font-semibold">{voucherData.jobTitle || "General"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Forma de Pago:</span>
              <span className="font-semibold text-slate-900 dark:text-white">{voucherData.paymentMethod === "CASH" ? "Efectivo en Caja" : "Transferencia / Depósito"}</span>
            </div>
            {voucherData.notes && (
              <div className="flex justify-between pt-1 border-t border-slate-100 dark:border-white/5">
                <span className="text-slate-500">Motivo:</span>
                <span className="text-slate-600 dark:text-slate-400 italic">{voucherData.notes}</span>
              </div>
            )}
          </div>

          {/* Monto Banner */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50">
            <div>
              <span className="font-bold text-amber-800 dark:text-amber-300 text-xs uppercase block">
                Monto del Anticipo
              </span>
              <span className="text-[10px] text-amber-700 dark:text-amber-400">
                A descontar en la próxima nómina
              </span>
            </div>
            <div className="text-right">
              <span className="font-bold text-amber-700 dark:text-amber-300 font-mono text-lg">
                ${voucherData.amount.toFixed(2)} M.N.
              </span>
            </div>
          </div>

          {/* Firmas Preview */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-2.5 rounded-lg border border-dashed border-slate-300 dark:border-white/20 text-center">
              <span className="text-[9px] font-bold uppercase text-slate-400 block mb-4">Entrega (Caja)</span>
              <div className="border-t border-slate-300 dark:border-white/20 pt-1 text-[10px] text-slate-500">Firma y Sello</div>
            </div>
            <div className="p-2.5 rounded-lg border border-dashed border-slate-300 dark:border-white/20 text-center">
              <span className="text-[9px] font-bold uppercase text-slate-400 block mb-4">Recibió (Empleado)</span>
              <div className="border-t border-slate-300 dark:border-white/20 pt-1 text-[10px] text-slate-900 dark:text-white font-bold">
                {voucherData.employeeName}
              </div>
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
            <span>Imprimir Vale (Carta / A4)</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
