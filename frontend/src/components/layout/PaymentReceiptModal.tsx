import React, { useRef } from "react";
import {
  Printer,
  X,
  Lock,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  ShieldCheck,
  Landmark,
  CheckCircle2,
} from "lucide-react";
import { useCompany } from "../../context/CompanyContext";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: any | null;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  isOpen,
  onClose,
  receipt,
}) => {
  const { activeCompany, formatCurrency } = useCompany();
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !receipt) return null;

  const isIncome = receipt.receiptType === "INCOME";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        {/* Top Action Bar (hidden when printing) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/60 print:hidden">
          <div className="flex items-center gap-2">
            <Badge variant={isIncome ? "success" : "info"} className="gap-1 px-2.5 py-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              {isIncome ? "RECIBO DE CAJA / COBRANZA" : "COMPROBANTE DE EGRESO"}
            </Badge>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              <Lock className="w-3 h-3" />
              <span>Inmutable</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={handlePrint} className="gap-1.5 shadow-sm">
              <Printer className="w-4 h-4" />
              <span>Imprimir Comprobante</span>
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div ref={printRef} className="p-8 space-y-6 text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-etiserv-blue text-white flex items-center justify-center font-bold text-lg shadow-md">
                  {activeCompany?.name?.charAt(0) || "D"}
                </div>
                <div>
                  <h1 className="text-lg font-bold font-heading text-slate-900 dark:text-white leading-tight">
                    {activeCompany?.name || "Distribuidora Nacional PyME S.A."}
                  </h1>
                  <p className="text-xs text-slate-500 font-mono">
                    RFC: {activeCompany?.taxId || "DNP-120405-XYZ"}
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 max-w-sm">
                Control de Tesorería, Cajas y Cuentas por Cobrar/Pagar
              </p>
            </div>

            <div className="text-right sm:text-right w-full sm:w-auto bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                {isIncome ? "FOLIO DE RECIBO" : "FOLIO DE EGRESO"}
              </div>
              <div className="text-xl font-mono font-bold text-etiserv-blue dark:text-blue-400">
                {receipt.receiptSeq}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-end gap-1">
                <Calendar className="w-3 h-3" />
                <span>Fecha: {receipt.paymentDate}</span>
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                Póliza Axelor: #{receipt.moveId}
              </div>
            </div>
          </div>

          {/* Partner & Method Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                {isIncome ? "RECIBIMOS DE (CLIENTE)" : "PAGAMOS A (PROVEEDOR)"}
              </span>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {receipt.partnerName}
              </div>
              {receipt.partnerTaxId && (
                <div className="text-xs font-mono text-slate-500">
                  RFC: {receipt.partnerTaxId}
                </div>
              )}
              {receipt.reference && (
                <div className="text-xs text-slate-500 mt-1">
                  <span className="font-semibold">Ref:</span> {receipt.reference}
                </div>
              )}
            </div>

            <div className="sm:border-l sm:border-slate-200 dark:sm:border-slate-700/60 sm:pl-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                MÉTODO Y CUENTA APLICADA
              </span>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                <CreditCard className="w-4 h-4 text-slate-400" />
                <span>
                  {receipt.paymentMethod === "CASH"
                    ? "Efectivo en Caja"
                    : receipt.paymentMethod === "BANK_TRANSFER" || receipt.paymentMethod === "SPEI"
                    ? "Transferencia Electrónica / SPEI"
                    : receipt.paymentMethod === "CHECK"
                    ? "Cheque Nominativo"
                    : "Tarjeta de Débito / Crédito"}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <Landmark className="w-3.5 h-3.5 text-slate-400" />
                <span>{receipt.sourceAccount || "Caja / Banco Operativo"}</span>
              </div>
            </div>
          </div>

          {/* Invoices Breakdown Table */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>Desglose de Facturas y Aplicación de Saldos</span>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4">Factura / Documento</th>
                    <th className="py-2.5 px-4 text-right">Saldo Anterior</th>
                    <th className="py-2.5 px-4 text-right bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400">
                      Monto Aplicado
                    </th>
                    <th className="py-2.5 px-4 text-right">Nuevo Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {receipt.invoicesSettled?.map((inv: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {inv.invoiceSeq || `FAC-${inv.invoiceId}`}
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-600 dark:text-slate-400 tabular-nums">
                        ${Number(inv.previousBalance ?? (inv.amountPaid + (inv.newBalance || 0))).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/10 tabular-nums">
                        ${Number(inv.amountPaid).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                        ${Number(inv.newBalance || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total Box */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-xl bg-slate-900 text-white dark:bg-slate-800 border border-slate-800">
            <div className="text-xs text-slate-300">
              <div className="font-semibold text-slate-200">
                {isIncome ? "IMPORTE TOTAL RECIBIDO:" : "IMPORTE TOTAL PAGADO:"}
              </div>
              <div className="text-[11px] text-slate-400 italic mt-0.5">
                {receipt.notes || "Operación procesada con éxito y registrada en libros contables."}
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-heading font-extrabold text-emerald-400 tabular-nums">
                ${Number(receipt.totalAmount).toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
              </div>
            </div>
          </div>

          {/* Security & Audit Seal */}
          <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>
                <strong>Sello de Control Interno:</strong> Documento sellado contablemente e INMUTABLE. No admite modificaciones posteriores.
              </span>
            </div>
            <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 hidden sm:inline">
              SEC-HASH-{receipt.receiptSeq}
            </span>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 dark:border-slate-800">
            <div className="text-center">
              <div className="border-b border-slate-300 dark:border-slate-700 h-12"></div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2">
                Firma de Tesorería / Caja
              </div>
              <div className="text-[10px] text-slate-400">Emisor Autorizado</div>
            </div>

            <div className="text-center">
              <div className="border-b border-slate-300 dark:border-slate-700 h-12"></div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2">
                {isIncome ? "Firma de Conformidad Cliente" : "Firma de Recibido Proveedor"}
              </div>
              <div className="text-[10px] text-slate-400">{receipt.partnerName}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
