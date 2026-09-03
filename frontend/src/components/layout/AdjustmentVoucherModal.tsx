import React, { useRef } from "react";
import { Printer, X, CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownLeft, ShieldCheck, Building2, Package } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";

export interface AdjustmentVoucherData {
  id: string;
  voucherSeq: string;
  date: string;
  companyName: string;
  companyTaxId: string;
  warehouseName: string;
  warehouseCode?: string;
  productId: number;
  productName: string;
  productCode: string;
  categoryName?: string;
  uomCode?: string;
  previousStock: number;
  physicalQty: number;
  deltaQty: number;
  adjustmentType: "INFLOW" | "OUTFLOW" | "NO_CHANGE";
  unitCost: number;
  totalImpactValue: number;
  reason: string;
  reasonLabel: string;
  notes?: string;
  stockMoveId: number;
  responsibleName?: string;
  status: "APPLIED";
}

interface AdjustmentVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  voucher: AdjustmentVoucherData | null;
}

export const AdjustmentVoucherModal: React.FC<AdjustmentVoucherModalProps> = ({
  isOpen,
  onClose,
  voucher,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!voucher) return null;

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Por favor habilita las ventanas emergentes para imprimir el vale.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Vale Oficial de Ajuste de Inventario - ${voucher.voucherSeq}</title>
          <style>
            @page { size: letter portrait; margin: 15mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 20px; font-size: 12px; }
            .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
            .title { font-size: 18px; font-weight: 800; text-transform: uppercase; color: #0f172a; margin: 0; }
            .seq { font-family: monospace; font-size: 16px; font-weight: bold; color: #2563eb; }
            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
            .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; }
            .box-title { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
            .table { width: 100%; border-collapse: collapse; margin-top: 12px; margin-bottom: 16px; }
            .table th { background: #f1f5f9; padding: 8px; text-align: left; font-size: 10px; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; }
            .table td { padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .font-mono { font-family: monospace; }
            .bold { font-weight: bold; }
            .inflow { color: #16a34a; font-weight: bold; }
            .outflow { color: #dc2626; font-weight: bold; }
            .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 50px; }
            .sign-line { border-top: 1px solid #0f172a; text-align: center; padding-top: 6px; font-size: 11px; font-weight: 600; }
            .footer { margin-top: 30px; font-size: 9px; color: #94a3b8; text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 8px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">${voucher.companyName}</div>
              <div style="color: #64748b; font-size: 11px;">RFC: ${voucher.companyTaxId}</div>
              <div style="font-size: 13px; font-weight: bold; margin-top: 4px;">VALE OFICIAL DE AJUSTE DE INVENTARIO</div>
            </div>
            <div style="text-align: right;">
              <div class="seq">${voucher.voucherSeq}</div>
              <div style="color: #64748b; font-size: 11px; margin-top: 2px;">Fecha: ${voucher.date}</div>
              <div style="font-size: 10px; color: #16a34a; font-weight: bold; margin-top: 2px;">🔒 CONTABILIZADO EN AXELOR #${voucher.stockMoveId}</div>
            </div>
          </div>

          <div class="grid-2">
            <div class="box">
              <div class="box-title">Ubicación / Almacén</div>
              <div class="bold" style="font-size: 13px;">${voucher.warehouseName}</div>
              <div style="color: #64748b; font-family: monospace; font-size: 10px;">Código: ${voucher.warehouseCode || "ALM"}</div>
            </div>
            <div class="box">
              <div class="box-title">Motivo del Ajuste</div>
              <div class="bold" style="font-size: 13px; color: #0f172a;">${voucher.reasonLabel}</div>
              <div style="color: #64748b; font-size: 10px;">${voucher.notes || "Sin observaciones adicionales"}</div>
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Código / SKU</th>
                <th>Descripción del Producto</th>
                <th class="text-right">Exist. Anterior</th>
                <th class="text-right">Conteo Físico</th>
                <th class="text-right">Diferencia (Δ)</th>
                <th class="text-right">Costo Unit.</th>
                <th class="text-right">Impacto Total ($)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="font-mono bold">${voucher.productCode}</td>
                <td>
                  <div class="bold">${voucher.productName}</div>
                  <div style="font-size: 10px; color: #64748b;">${voucher.categoryName || "General"}</div>
                </td>
                <td class="text-right font-mono">${voucher.previousStock} ${voucher.uomCode || "PZA"}</td>
                <td class="text-right font-mono bold" style="font-size: 12px;">${voucher.physicalQty} ${voucher.uomCode || "PZA"}</td>
                <td class="text-right font-mono ${voucher.deltaQty >= 0 ? "inflow" : "outflow"}">
                  ${voucher.deltaQty > 0 ? `+${voucher.deltaQty}` : voucher.deltaQty} ${voucher.uomCode || "PZA"}
                </td>
                <td class="text-right font-mono">$${voucher.unitCost.toFixed(2)}</td>
                <td class="text-right font-mono bold" style="font-size: 12px;">$${voucher.totalImpactValue.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin-top: 10px;">
            <div class="grid-2">
              <div>
                <span class="box-title">Tipo de Movimiento Contable:</span>
                <div class="bold" style="margin-top: 2px;">
                  ${voucher.deltaQty > 0 ? "ENTRADA POR AJUSTE (SOBRANTE / INVENTARIO INICIAL)" : voucher.deltaQty < 0 ? "SALIDA POR AJUSTE (MERMA / FALTANTE)" : "SIN VARIACIÓN (CONTEO VALIDADO)"}
                </div>
              </div>
              <div class="text-right">
                <span class="box-title">Variación Neta Valorizada:</span>
                <div class="bold" style="font-size: 14px; margin-top: 2px; color: ${voucher.deltaQty >= 0 ? "#16a34a" : "#dc2626"};">
                  ${voucher.deltaQty >= 0 ? "+" : "-"}$${voucher.totalImpactValue.toFixed(2)} MXN
                </div>
              </div>
            </div>
          </div>

          <div class="signatures">
            <div>
              <div class="sign-line">
                ${voucher.responsibleName || "Responsable de Bodega / Almacén"}<br/>
                <span style="font-size: 9px; color: #64748b; font-weight: normal;">Entrega / Ajustó en Almacén</span>
              </div>
            </div>
            <div>
              <div class="sign-line">
                Auditoría / Control de Inventarios<br/>
                <span style="font-size: 9px; color: #64748b; font-weight: normal;">Autorización y Validación Contable</span>
              </div>
            </div>
          </div>

          <div class="footer">
            Documento Oficial de Control Interno • Axelor PyME ERP • Póliza de Movimiento de Inventario #${voucher.stockMoveId}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  const isPositive = voucher.deltaQty > 0;
  const isNegative = voucher.deltaQty < 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Vale Oficial de Ajuste de Inventario Físico"
      maxWidth="lg"
    >
      <div className="space-y-4 text-xs">
        {/* Printable View Container */}
        <div
          ref={printRef}
          className="p-5 rounded-2xl bg-white dark:bg-[#071C33] border border-slate-200 dark:border-white/10 space-y-4 shadow-sm"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-etiserv-blue" />
                <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white">
                  {voucher.companyName}
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">RFC: {voucher.companyTaxId}</p>
            </div>
            <div className="text-left sm:text-right">
              <span className="font-mono text-sm font-extrabold text-etiserv-blue bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-900/50 block w-fit sm:ml-auto">
                {voucher.voucherSeq}
              </span>
              <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                Fecha: {voucher.date} • Póliza #{voucher.stockMoveId}
              </span>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-slate-200/80 dark:border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">
                Bodega / Ubicación Afectada
              </span>
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs">
                <Building2 className="w-3.5 h-3.5 text-etiserv-blue" />
                <span>{voucher.warehouseName}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Código: {voucher.warehouseCode || "ALM"}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-slate-200/80 dark:border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">
                Motivo del Ajuste
              </span>
              <div className="font-bold text-slate-900 dark:text-white text-xs">
                {voucher.reasonLabel}
              </div>
              <span className="text-[10px] text-slate-500 block truncate">
                {voucher.notes || "Sin observaciones"}
              </span>
            </div>
          </div>

          {/* Product Adjustment Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-white/[0.03] text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-white/10">
                <tr>
                  <th className="py-2.5 px-3">Código SKU</th>
                  <th className="py-2.5 px-3">Producto</th>
                  <th className="py-2.5 px-3 text-right">Exist. Anterior</th>
                  <th className="py-2.5 px-3 text-right">Conteo Físico</th>
                  <th className="py-2.5 px-3 text-right">Diferencia (Δ)</th>
                  <th className="py-2.5 px-3 text-right">Costo Unit.</th>
                  <th className="py-2.5 px-3 text-right">Impacto Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                <tr>
                  <td className="py-3 px-3 font-mono font-bold text-etiserv-blue">
                    {voucher.productCode}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {voucher.productName}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {voucher.categoryName || "General"}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                    {voucher.previousStock} {voucher.uomCode || "PZA"}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white text-sm">
                    {voucher.physicalQty} {voucher.uomCode || "PZA"}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold">
                    <Badge
                      variant={isPositive ? "success" : isNegative ? "danger" : "neutral"}
                      className="gap-1 text-[11px]"
                    >
                      {isPositive ? (
                        <>
                          <ArrowDownLeft className="w-3 h-3" /> +{voucher.deltaQty}
                        </>
                      ) : isNegative ? (
                        <>
                          <ArrowUpRight className="w-3 h-3" /> {voucher.deltaQty}
                        </>
                      ) : (
                        "0"
                      )}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                    ${voucher.unitCost.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white text-sm">
                    ${voucher.totalImpactValue.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Audit Badge & Status */}
          <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-bold text-xs">
                Ajuste Procesado y Asentado en Axelor ERP
              </span>
            </div>
            <span className="font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
              Movimiento #{voucher.stockMoveId}
            </span>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cerrar
          </Button>

          <Button
            variant="primary"
            glow
            size="sm"
            onClick={handlePrint}
            className="gap-1.5 font-bold shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Vale Oficial</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
