import React from "react";
import { Printer, CheckCircle2, FileText, UserCheck, ShieldCheck } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

export interface PayrollReceiptData {
  receiptNumber: string;
  companyName: string;
  companyTaxId?: string;
  period: string;
  date: string;
  employeeName: string;
  employeeTaxId?: string;
  employeeCode?: string;
  jobTitle?: string;
  paymentPeriod?: string;
  paymentMethod?: string;
  // Percepciones
  baseSalary: number;
  bonus: number;
  overtime: number;
  totalGross: number;
  // Deducciones
  taxDeduction: number; // ISR
  imssDeduction: number; // IMSS
  advanceDeduction: number; // Anticipos
  otherDeductions: number;
  totalDeductions: number;
  // Total Neto
  netPay: number;
}

interface PayrollReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: PayrollReceiptData | null;
}

export const PayrollReceiptModal: React.FC<PayrollReceiptModalProps> = ({
  isOpen,
  onClose,
  receiptData,
}) => {
  if (!receiptData) return null;

  // 1. Impresión en Formato Carta Formal (A4 / Carta)
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
          <title>Recibo de Nómina #${receiptData.receiptNumber}</title>
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
              font-size: 11px;
              line-height: 1.35;
            }
            .header-table {
              width: 100%;
              border-bottom: 2px solid #1e3a8a;
              padding-bottom: 10px;
              margin-bottom: 12px;
            }
            .company-title {
              font-size: 17px;
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
              font-size: 15px;
              font-weight: 900;
              font-family: monospace;
              color: #0f172a;
              text-align: right;
              margin-top: 2px;
            }
            .info-table {
              width: 100%;
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              margin-bottom: 12px;
              border-collapse: collapse;
              font-size: 11px;
            }
            .info-cell {
              padding: 6px 10px;
              border: 1px solid #cbd5e1;
              vertical-align: top;
            }
            .info-label {
              font-size: 9px;
              font-weight: bold;
              text-transform: uppercase;
              color: #64748b;
              display: block;
              margin-bottom: 1px;
            }
            .info-val {
              font-weight: bold;
              color: #0f172a;
            }
            .breakdown-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              overflow: hidden;
            }
            .breakdown-table th {
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              padding: 6px 8px;
              border-bottom: 1px solid #cbd5e1;
            }
            .breakdown-table td {
              padding: 5px 8px;
              border-bottom: 1px solid #f1f5f9;
              font-size: 11px;
            }
            .total-banner {
              display: flex;
              justify-content: space-between;
              align-items: center;
              background: #f0fdf4;
              border: 2px solid #16a34a;
              border-radius: 8px;
              padding: 10px 16px;
              margin-bottom: 20px;
            }
            .legal-text {
              font-size: 9px;
              color: #64748b;
              line-height: 1.35;
              text-align: justify;
              padding: 8px;
              border: 1px dashed #cbd5e1;
              border-radius: 6px;
              margin-bottom: 25px;
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
              padding: 10px;
              text-align: center;
              font-size: 10px;
              vertical-align: top;
            }
            .sig-line {
              margin-top: 45px;
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
                <h1 class="company-title">${receiptData.companyName}</h1>
                ${receiptData.companyTaxId ? `<p style="font-size: 11px; color: #475569; font-weight: 600;">RFC: ${receiptData.companyTaxId}</p>` : ""}
                <p style="font-size: 10px; color: #64748b;">Comprobante Individual de Pago de Salarios & Prestaciones</p>
              </td>
              <td>
                <div class="doc-title">RECIBO DE NÓMINA</div>
                <div class="doc-folio">FOLIO: ${receiptData.receiptNumber}</div>
                <div style="font-size: 10px; color: #64748b; text-align: right; margin-top: 2px;">Periodo: <strong>${receiptData.period}</strong></div>
              </td>
            </tr>
          </table>

          <table class="info-table">
            <tr>
              <td class="info-cell" style="width: 50%;">
                <span class="info-label">COLABORADOR / EMPLEADO:</span>
                <span class="info-val" style="font-size: 13px; color: #1e3a8a;">${receiptData.employeeName}</span>
                <span style="font-size: 10px; color: #64748b; display: block; margin-top: 2px;">Cód: ${receiptData.employeeCode || "EMP-01"} • RFC: ${receiptData.employeeTaxId || "XAXX010101000"}</span>
              </td>
              <td class="info-cell" style="width: 50%;">
                <span class="info-label">PUESTO / CARGO & FORMA DE PAGO:</span>
                <span class="info-val">${receiptData.jobTitle || "Colaborador General"}</span>
                <span style="font-size: 10px; color: #64748b; display: block; margin-top: 2px;">Frecuencia: ${receiptData.paymentPeriod || "Quincenal"} • Pago: ${receiptData.paymentMethod || "Transferencia / Depósito"}</span>
              </td>
            </tr>
          </table>

          <div style="display: flex; gap: 12px; margin-bottom: 12px;">
            <!-- PERCEPCIONES -->
            <table class="breakdown-table" style="width: 50%;">
              <thead>
                <tr style="background: #eff6ff; color: #1e40af;">
                  <th>Concepto Percepción</th>
                  <th style="text-align: right;">Importe</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>001 Sueldo Base Devengado</td>
                  <td style="text-align: right; font-family: monospace; font-weight: bold;">$${receiptData.baseSalary.toFixed(2)}</td>
                </tr>
                ${receiptData.bonus > 0 ? `
                <tr>
                  <td>002 Bonos / Comisiones / Incentivos</td>
                  <td style="text-align: right; font-family: monospace; font-weight: bold; color: #166534;">+$${receiptData.bonus.toFixed(2)}</td>
                </tr>` : ""}
                ${receiptData.overtime > 0 ? `
                <tr>
                  <td>003 Horas Extraordinarias</td>
                  <td style="text-align: right; font-family: monospace; font-weight: bold; color: #166534;">+$${receiptData.overtime.toFixed(2)}</td>
                </tr>` : ""}
                <tr style="background: #f8fafc; font-weight: bold; border-top: 2px solid #cbd5e1;">
                  <td>TOTAL PERCEPCIONES:</td>
                  <td style="text-align: right; font-family: monospace; color: #1e3a8a;">$${receiptData.totalGross.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <!-- DEDUCCIONES -->
            <table class="breakdown-table" style="width: 50%;">
              <thead>
                <tr style="background: #fff1f2; color: #9f1239;">
                  <th>Concepto Deducción</th>
                  <th style="text-align: right;">Importe</th>
                </tr>
              </thead>
              <tbody>
                ${receiptData.advanceDeduction > 0 ? `
                <tr style="background: #fffbeb;">
                  <td style="color: #92400e; font-weight: bold;">103 Amortización Anticipo Sueldo</td>
                  <td style="text-align: right; font-family: monospace; font-weight: bold; color: #b45309;">-$${receiptData.advanceDeduction.toFixed(2)}</td>
                </tr>` : ""}
                ${receiptData.taxDeduction > 0 ? `
                <tr>
                  <td>101 Retención ISR Salarios</td>
                  <td style="text-align: right; font-family: monospace; font-weight: bold; color: #9f1239;">-$${receiptData.taxDeduction.toFixed(2)}</td>
                </tr>` : ""}
                ${receiptData.imssDeduction > 0 ? `
                <tr>
                  <td>102 Cuota Obrera IMSS</td>
                  <td style="text-align: right; font-family: monospace; font-weight: bold; color: #9f1239;">-$${receiptData.imssDeduction.toFixed(2)}</td>
                </tr>` : ""}
                ${receiptData.otherDeductions > 0 ? `
                <tr>
                  <td>104 Otras Deducciones / Faltas</td>
                  <td style="text-align: right; font-family: monospace; font-weight: bold; color: #9f1239;">-$${receiptData.otherDeductions.toFixed(2)}</td>
                </tr>` : ""}
                ${receiptData.totalDeductions === 0 ? `
                <tr>
                  <td colspan="2" style="text-align: center; color: #94a3b8; font-style: italic;">Sin deducciones aplicadas en el periodo</td>
                </tr>` : ""}
                <tr style="background: #f8fafc; font-weight: bold; border-top: 2px solid #cbd5e1;">
                  <td>TOTAL DEDUCCIONES:</td>
                  <td style="text-align: right; font-family: monospace; color: #9f1239;">-$${receiptData.totalDeductions.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="total-banner">
            <div>
              <span style="font-size: 10px; font-weight: bold; color: #166534; text-transform: uppercase; display: block;">LÍQUIDO / NETO A RECIBIR:</span>
              <span style="font-size: 11px; color: #475569; font-weight: 600;">Concepto: Sueldos correspondientes al periodo ${receiptData.period}</span>
            </div>
            <div style="font-size: 20px; font-weight: 900; font-family: monospace; color: #15803d;">
              $${receiptData.netPay.toFixed(2)} M.N.
            </div>
          </div>

          <div class="legal-text">
            <strong>CONFORMIDAD DE PAGO Y LIQUIDACIÓN LABORAL:</strong> Recibí de la empresa la cantidad neta que expresa este recibo de pago, estando conforme con las percepciones y retenciones especificadas, manifestando que a la presente fecha no se me adeuda salario ordinario, extraordinario ni prestación legal alguna, sirviendo este documento como el más formal y eficaz finiquito de las obligaciones correspondientes a dicho periodo.
          </div>

          <table class="signatures-table">
            <tr>
              <td class="signature-box">
                <span style="font-weight: bold; color: #1e3a8a; font-size: 10px; text-transform: uppercase;">Por la Empresa / RRHH</span>
                <p style="font-size: 9px; color: #64748b; margin-top: 2px;">Autorizado & Dispersado</p>
                <div class="sig-line">Nombre y Firma Autorizada</div>
              </td>
              <td style="width: 8%;"></td>
              <td class="signature-box">
                <span style="font-weight: bold; color: #15803d; font-size: 10px; text-transform: uppercase;">Firma del Trabajador</span>
                <p style="font-size: 9px; color: #64748b; margin-top: 2px;">Recibí de Conformidad</p>
                <div class="sig-line">${receiptData.employeeName}</div>
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
          <title>Recibo Nómina #${receiptData.receiptNumber}</title>
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
            <h3>${receiptData.companyName}</h3>
            ${receiptData.companyTaxId ? `<p style="font-size: 10px;">RFC: ${receiptData.companyTaxId}</p>` : ""}
            <p style="font-size: 11px; font-weight: bold; margin-top: 4px;">RECIBO DE NÓMINA</p>
            <p style="font-size: 11px; font-weight: bold;">#${receiptData.receiptNumber}</p>
            <p style="font-size: 9px;">Periodo: ${receiptData.period}</p>
          </div>

          <div class="divider"></div>

          <div style="font-size: 10px;">
            <div><strong>EMPLEADO:</strong> ${receiptData.employeeName}</div>
            <div><strong>PUESTO:</strong> ${receiptData.jobTitle || "General"}</div>
            <div><strong>RFC:</strong> ${receiptData.employeeTaxId || "XAXX010101000"}</div>
          </div>

          <div class="divider"></div>

          <div style="font-size: 10px;">
            <div class="row">
              <span>Sueldo Base:</span>
              <span class="font-bold">$${receiptData.baseSalary.toFixed(2)}</span>
            </div>
            ${receiptData.bonus > 0 ? `
            <div class="row">
              <span>Bonos / Extras:</span>
              <span class="font-bold">+$${receiptData.bonus.toFixed(2)}</span>
            </div>` : ""}
            ${receiptData.advanceDeduction > 0 ? `
            <div class="row">
              <span>Desc. Anticipo:</span>
              <span class="font-bold">-$${receiptData.advanceDeduction.toFixed(2)}</span>
            </div>` : ""}
            ${receiptData.taxDeduction > 0 ? `
            <div class="row">
              <span>Retención ISR:</span>
              <span class="font-bold">-$${receiptData.taxDeduction.toFixed(2)}</span>
            </div>` : ""}
          </div>

          <div class="divider"></div>

          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 13px;">
            <span>NETO A PAGAR:</span>
            <span>$${receiptData.netPay.toFixed(2)}</span>
          </div>

          <div class="divider"></div>

          <p style="font-size: 8px; text-align: justify; margin-top: 4px;">
            Recibí de conformidad el importe de este recibo por concepto de mis salarios del periodo.
          </p>

          <div class="sig-box">
            Firma del Trabajador<br/>
            ${receiptData.employeeName}
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
    <Modal isOpen={isOpen} onClose={onClose} title="Recibo Oficial de Nómina & Sueldo" maxWidth="lg">
      <div className="space-y-4">
        {/* Preview Card */}
        <div className="bg-slate-50 dark:bg-[#071C33] p-5 rounded-2xl border border-slate-200 dark:border-white/10 space-y-4 text-xs">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase">
                  {receiptData.companyName}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Recibo de Pago de Nómina • Periodo: <strong>{receiptData.period}</strong>
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="font-mono text-xs font-bold text-etiserv-blue bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-900/50 block">
                FOLIO: {receiptData.receiptNumber}
              </span>
            </div>
          </div>

          {/* Colaborador info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                Colaborador / Trabajador:
              </span>
              <div className="font-bold text-slate-900 dark:text-white text-xs">
                {receiptData.employeeName}
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                RFC: {receiptData.employeeTaxId || "XAXX010101000"} • Cód: {receiptData.employeeCode || "EMP-01"}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                Puesto & Frecuencia:
              </span>
              <div className="font-bold text-slate-900 dark:text-white text-xs">
                {receiptData.jobTitle || "Colaborador General"}
              </div>
              <span className="text-[10px] text-slate-500">
                Pago {receiptData.paymentPeriod || "Quincenal"} vía {receiptData.paymentMethod || "Bancos / Depósito"}
              </span>
            </div>
          </div>

          {/* Desglose Percepciones & Deducciones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Percepciones */}
            <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 space-y-2">
              <div className="flex items-center justify-between font-bold text-blue-900 dark:text-blue-300 text-[11px] pb-1 border-b border-blue-200 dark:border-blue-900/40">
                <span>Percepciones (+)</span>
                <span>Importe</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-600 dark:text-slate-300">Sueldo Base:</span>
                <span className="font-mono font-bold">${receiptData.baseSalary.toFixed(2)}</span>
              </div>
              {receiptData.bonus > 0 && (
                <div className="flex justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Bonos / Comisiones:</span>
                  <span className="font-mono font-bold">+${receiptData.bonus.toFixed(2)}</span>
                </div>
              )}
              {receiptData.overtime > 0 && (
                <div className="flex justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Horas Extraordinarias:</span>
                  <span className="font-mono font-bold">+${receiptData.overtime.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-blue-900 dark:text-blue-300 pt-1.5 border-t border-blue-200 dark:border-blue-900/40 text-xs">
                <span>Total Bruto:</span>
                <span className="font-mono">${receiptData.totalGross.toFixed(2)}</span>
              </div>
            </div>

            {/* Deducciones */}
            <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-2">
              <div className="flex items-center justify-between font-bold text-rose-900 dark:text-rose-300 text-[11px] pb-1 border-b border-rose-200 dark:border-rose-900/40">
                <span>Deducciones (-)</span>
                <span>Importe</span>
              </div>
              {receiptData.advanceDeduction > 0 && (
                <div className="flex justify-between text-[11px] text-amber-700 dark:text-amber-400 font-bold bg-amber-50/60 dark:bg-amber-950/30 px-1.5 py-0.5 rounded">
                  <span>Desc. Anticipo de Sueldo:</span>
                  <span className="font-mono">-${receiptData.advanceDeduction.toFixed(2)}</span>
                </div>
              )}
              {receiptData.taxDeduction > 0 && (
                <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300">
                  <span>Retención ISR:</span>
                  <span className="font-mono font-bold">-${receiptData.taxDeduction.toFixed(2)}</span>
                </div>
              )}
              {receiptData.imssDeduction > 0 && (
                <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300">
                  <span>Cuota IMSS:</span>
                  <span className="font-mono font-bold">-${receiptData.imssDeduction.toFixed(2)}</span>
                </div>
              )}
              {receiptData.totalDeductions === 0 && (
                <div className="text-[11px] text-slate-400 italic text-center py-1">
                  Sin retenciones adicionales
                </div>
              )}
              <div className="flex justify-between font-bold text-rose-900 dark:text-rose-300 pt-1.5 border-t border-rose-200 dark:border-rose-900/40 text-xs">
                <span>Total Deducciones:</span>
                <span className="font-mono">-${receiptData.totalDeductions.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Neto a pagar */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50">
            <div>
              <span className="font-bold text-emerald-800 dark:text-emerald-300 text-xs uppercase block">
                Total Neto Liquidado al Trabajador
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                Periodo {receiptData.period} • No se adeuda salario alguno
              </span>
            </div>
            <div className="text-right">
              <span className="font-bold text-emerald-700 dark:text-emerald-300 font-mono text-lg">
                ${receiptData.netPay.toFixed(2)} M.N.
              </span>
            </div>
          </div>

          {/* Firmas Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-lg border border-dashed border-slate-300 dark:border-white/20 text-center">
              <span className="text-[9px] font-bold uppercase text-slate-400 block mb-4">Empresa / RRHH</span>
              <div className="border-t border-slate-300 dark:border-white/20 pt-1 text-[10px] text-slate-500 font-bold">
                Autorizado & Dispersado
              </div>
            </div>
            <div className="p-3 rounded-lg border border-dashed border-slate-300 dark:border-white/20 text-center">
              <span className="text-[9px] font-bold uppercase text-slate-400 block mb-4">Firma del Trabajador</span>
              <div className="border-t border-slate-300 dark:border-white/20 pt-1 text-[10px] text-slate-900 dark:text-white font-bold">
                {receiptData.employeeName}
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
            <span>Imprimir Recibo de Nómina (Carta / A4)</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
