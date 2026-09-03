import React, { useState, useEffect } from "react";
import {
  X,
  Zap,
  DollarSign,
  Calendar,
  CreditCard,
  Building2,
  Lock,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { useCompany } from "../../context/CompanyContext";
import { catalogApi } from "../../api/catalogApi";
import { financeApi } from "../../api/financeApi";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";

interface QuickPaymentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  type: "CUSTOMER" | "SUPPLIER";
  initialPartnerId?: number | null;
  onSuccess: (receipt: any) => void;
}

interface InvoiceRow {
  id: number;
  invoiceSeq: string;
  invoiceDate: string;
  dueDate: string;
  inTaxTotal: number;
  amountPaid: number;
  amountRemaining: number;
  daysOverdue: number;
  allocatedAmount: number;
}

export const QuickPaymentDrawer: React.FC<QuickPaymentDrawerProps> = ({
  isOpen,
  onClose,
  type,
  initialPartnerId,
  onSuccess,
}) => {
  const { activeCompany, formatCurrency } = useCompany();
  const isCustomer = type === "CUSTOMER";

  const [partners, setPartners] = useState<any[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | "">(initialPartnerId || "");
  const [loadingPartners, setLoadingPartners] = useState(false);

  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  // Payment inputs
  const [globalAmount, setGlobalAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "BANK_TRANSFER" | "CHECK" | "CARD" | "SPEI">("CASH");
  const [sourceAccount, setSourceAccount] = useState<"CASH" | "BANK">("CASH");
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load partners list
  useEffect(() => {
    if (!isOpen || !activeCompany) return;
    const fetchPartners = async () => {
      try {
        setLoadingPartners(true);
        const res = await catalogApi.listPartners(activeCompany.id, isCustomer ? "CUSTOMER" : "SUPPLIER");
        const list = Array.isArray(res) ? res : (res as any)?.data || [];
        setPartners(list);

        if (initialPartnerId) {
          setSelectedPartnerId(initialPartnerId);
        } else if (list.length > 0 && !selectedPartnerId) {
          setSelectedPartnerId(list[0].id);
        }
      } catch (err) {
        console.error("Error al cargar socios:", err);
      } finally {
        setLoadingPartners(false);
      }
    };
    fetchPartners();
  }, [isOpen, activeCompany, isCustomer, initialPartnerId]);

  // Load pending invoices for selected partner
  const loadPartnerInvoices = async (partnerId: number) => {
    if (!activeCompany) return;
    try {
      setLoadingInvoices(true);
      const res = await financeApi.getPartnerPendingInvoices(partnerId, activeCompany.id, type);
      const rows: InvoiceRow[] = (res.invoices || []).map((inv: any) => ({
        ...inv,
        allocatedAmount: 0,
      }));
      setInvoices(rows);
      setTotalOutstanding(res.totalOutstanding || 0);
      setGlobalAmount("");
    } catch (err) {
      console.error("Error al cargar facturas de partner:", err);
      setInvoices([]);
      setTotalOutstanding(0);
    } finally {
      setLoadingInvoices(false);
    }
  };

  useEffect(() => {
    if (selectedPartnerId && typeof selectedPartnerId === "number") {
      loadPartnerInvoices(selectedPartnerId);
    } else {
      setInvoices([]);
      setTotalOutstanding(0);
    }
  }, [selectedPartnerId, activeCompany, type]);

  // FIFO Auto-Allocation Engine: distributes amount starting with oldest invoice
  const applyFifoDistribution = (targetAmount: number) => {
    let remPool = Math.max(0, targetAmount);
    const updated = invoices.map((inv) => {
      if (remPool <= 0) {
        return { ...inv, allocatedAmount: 0 };
      }
      const canPay = Math.min(inv.amountRemaining, remPool);
      const rounded = Number(canPay.toFixed(2));
      remPool -= rounded;
      return { ...inv, allocatedAmount: rounded };
    });
    setInvoices(updated);
  };

  const handleGlobalAmountChange = (val: string) => {
    setGlobalAmount(val);
    const parsed = parseFloat(val) || 0;
    applyFifoDistribution(parsed);
  };

  const handlePayAll = () => {
    setGlobalAmount(totalOutstanding.toString());
    applyFifoDistribution(totalOutstanding);
  };

  const handleRowAmountChange = (index: number, val: string) => {
    const parsed = Math.max(0, parseFloat(val) || 0);
    const updated = [...invoices];
    const maxAllowed = updated[index].amountRemaining;
    updated[index].allocatedAmount = Math.min(parsed, maxAllowed);
    setInvoices(updated);

    const newTotal = updated.reduce((sum, item) => sum + item.allocatedAmount, 0);
    setGlobalAmount(newTotal > 0 ? newTotal.toFixed(2) : "");
  };

  const totalAllocated = Number(
    invoices.reduce((sum, item) => sum + (item.allocatedAmount || 0), 0).toFixed(2)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany || !selectedPartnerId || totalAllocated <= 0) {
      alert("Por favor ingrese un monto a aplicar mayor a $0");
      return;
    }

    const allocations = invoices
      .filter((inv) => inv.allocatedAmount > 0)
      .map((inv) => ({
        invoiceId: inv.id,
        invoiceSeq: inv.invoiceSeq,
        amountPaid: inv.allocatedAmount,
        previousBalance: inv.amountRemaining,
        newBalance: Number((inv.amountRemaining - inv.allocatedAmount).toFixed(2)),
      }));

    const partnerObj = partners.find((p) => p.id === Number(selectedPartnerId));

    try {
      setSubmitting(true);
      const res = await financeApi.createQuickPayment({
        companyId: activeCompany.id,
        partnerId: Number(selectedPartnerId),
        partnerName: partnerObj?.name || (isCustomer ? "Cliente" : "Proveedor"),
        partnerType: type,
        totalAmount: totalAllocated,
        paymentMethod,
        sourceAccount,
        paymentDate,
        reference,
        notes,
        allocations,
      });

      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      alert(`Error al procesar el recibo: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-sm ${
                isCustomer
                  ? "bg-emerald-500 text-white"
                  : "bg-blue-600 text-white"
              }`}
            >
              {isCustomer ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-heading text-slate-900 dark:text-white">
                  {isCustomer ? "⚡ Cobro Rápido (Recibo de Caja)" : "⚡ Pago a Proveedor (Comprobante de Egreso)"}
                </h2>
                <Badge variant={isCustomer ? "success" : "info"}>
                  {isCustomer ? "CxC Ingreso" : "CxP Egreso"}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Aplicación inteligente FIFO de facturas y emisión de recibo oficial inmutable
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Partner Selector */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{isCustomer ? "Seleccionar Cliente" : "Seleccionar Proveedor"}</span>
              </label>
              {totalOutstanding > 0 && (
                <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800">
                  Saldo Total Pendiente: ${totalOutstanding.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </div>
              )}
            </div>

            <Select
              value={selectedPartnerId}
              onChange={(e) => setSelectedPartnerId(Number(e.target.value))}
              disabled={loadingPartners}
              className="w-full text-sm font-semibold"
            >
              <option value="">-- Seleccione un socio comercial --</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name || p.fullName} ({p.code || `ID ${p.id}`})
                </option>
              ))}
            </Select>
          </div>

          {/* Quick Amount & FIFO Auto-Allocation Box */}
          {selectedPartnerId && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Importe a Abonar / Cobrar (FIFO)
                  </span>
                </div>
                {totalOutstanding > 0 && (
                  <button
                    type="button"
                    onClick={handlePayAll}
                    className="text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 px-2.5 py-1 rounded-md transition-all flex items-center gap-1 shadow-sm"
                  >
                    <Zap className="w-3 h-3 fill-current" />
                    <span>Saldar Todo (${totalOutstanding.toFixed(2)})</span>
                  </button>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-lg font-bold">
                  $
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={totalOutstanding || undefined}
                  value={globalAmount}
                  onChange={(e) => handleGlobalAmountChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-3 bg-slate-950/70 border border-slate-700 rounded-xl text-2xl font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-300 pt-1 border-t border-slate-700/60">
                <span>Total asignado a facturas:</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  ${totalAllocated.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
                </span>
              </div>
            </div>
          )}

          {/* Invoices List with FIFO rows */}
          {selectedPartnerId && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Facturas Pendientes (Orden Cronológico / FIFO)</span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {invoices.length} {invoices.length === 1 ? "factura" : "facturas"}
                </span>
              </div>

              {loadingInvoices ? (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-etiserv-blue" />
                  <span className="text-xs">Consultando cartera en Axelor...</span>
                </div>
              ) : invoices.length === 0 ? (
                <div className="py-8 text-center text-slate-500 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs">
                  ✨ Este socio comercial no tiene facturas pendientes de cobro o pago.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Factura</th>
                        <th className="py-2.5 px-3">Vence</th>
                        <th className="py-2.5 px-3 text-right">Saldo</th>
                        <th className="py-2.5 px-3 text-right w-36 bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400">
                          Abono a Aplicar
                        </th>
                        <th className="py-2.5 px-3 text-right">Nuevo Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {invoices.map((inv, idx) => {
                        const newBal = Number(Math.max(0, inv.amountRemaining - (inv.allocatedAmount || 0)).toFixed(2));
                        const isFull = inv.allocatedAmount >= inv.amountRemaining;
                        return (
                          <tr
                            key={inv.id}
                            className={`transition-colors ${
                              inv.allocatedAmount > 0
                                ? "bg-emerald-50/30 dark:bg-emerald-950/10"
                                : "hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                            }`}
                          >
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                              {inv.invoiceSeq}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                              {inv.dueDate}
                              {inv.daysOverdue > 0 && (
                                <span className="ml-1 text-[10px] text-rose-500 font-bold">
                                  (+{inv.daysOverdue}d)
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                              ${inv.amountRemaining.toFixed(2)}
                            </td>
                            <td className="py-1.5 px-3 text-right bg-amber-50/30 dark:bg-amber-950/10">
                              <div className="relative">
                                <span className="absolute inset-y-0 left-2 flex items-center text-slate-400 font-bold text-xs">
                                  $
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max={inv.amountRemaining}
                                  value={inv.allocatedAmount || ""}
                                  onChange={(e) => handleRowAmountChange(idx, e.target.value)}
                                  className="w-full pl-5 pr-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-mono font-bold text-right text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500"
                                  placeholder="0.00"
                                />
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-xs tabular-nums">
                              {isFull ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-end gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Saldada
                                </span>
                              ) : (
                                <span className="text-slate-600 dark:text-slate-400">
                                  ${newBal.toFixed(2)}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Payment Method & Financial Account */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                Método de Pago
              </label>
              <Select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full text-xs font-semibold"
              >
                <option value="CASH">💵 Efectivo en Caja</option>
                <option value="BANK_TRANSFER">🏦 Transferencia Bancaria (SPEI)</option>
                <option value="CHECK">📜 Cheque Nominativo</option>
                <option value="CARD">💳 Tarjeta de Débito / Crédito</option>
              </Select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                Cuenta de Tesorería
              </label>
              <Select
                value={sourceAccount}
                onChange={(e) => setSourceAccount(e.target.value as any)}
                className="w-full text-xs font-semibold"
              >
                <option value="CASH">Caja Mostrador POS (101.01)</option>
                <option value="BANK">BBVA México Operativa (102.01)</option>
              </Select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                Fecha del Pago
              </label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                Referencia / Folio Externo
              </label>
              <Input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="ej: SPEI-981240 / CHQ-104"
                className="w-full text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                Notas / Concepto
              </label>
              <Input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones de la cobranza o desembolso..."
                className="w-full text-xs"
              />
            </div>
          </div>

          {/* Immutability Notice */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
            <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
              <strong>Control Interno &amp; Regla de Inmutabilidad:</strong> Al hacer clic en emitir, se generará el asiento contable y el recibo oficial quedará sellado de forma <strong>INMUTABLE</strong> para auditoría fiscal.
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between shrink-0">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Total a Procesar</div>
            <div className="text-xl font-heading font-extrabold text-slate-900 dark:text-white tabular-nums">
              ${totalAllocated.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              variant={isCustomer ? "success" : "primary"}
              size="sm"
              onClick={handleSubmit}
              loading={submitting}
              disabled={totalAllocated <= 0 || submitting}
              className="gap-1.5 shadow-md font-bold px-4"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {isCustomer ? "Emitir Recibo de Caja" : "Emitir Comprobante de Egreso"}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
