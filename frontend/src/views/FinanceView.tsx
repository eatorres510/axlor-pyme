import React, { useEffect, useState } from "react";
import {
  CreditCard,
  TrendingDown,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Landmark,
  FileSpreadsheet,
  PieChart,
  RotateCcw,
  FileText,
  UserCheck,
  ShieldAlert,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownLeft,
  Zap,
  Link2,
  PlusCircle,
  CheckSquare,
  Sparkles,
  HelpCircle,
  Lock,
  Unlock,
} from "lucide-react";
import { useCompany } from "../context/CompanyContext";
import { catalogApi } from "../api/catalogApi";
import {
  financeApi,
  AgingReport,
  AgingItem,
  BankReconciliationItem,
  PnLReport,
  PartnerStatement,
  StatementMovement,
} from "../api/financeApi";
import { DocumentDetailModal } from "../components/modals/DocumentDetailModal";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Autocomplete, AutocompleteItem } from "../components/ui/Autocomplete";

interface FinanceViewProps {
  initialTab?: "AGING" | "STATEMENT" | "RECONCILIATION" | "PNL";
}

export const FinanceView: React.FC<FinanceViewProps> = ({ initialTab }) => {
  const { activeCompany } = useCompany();
  const [activeTab, setActiveTab] = useState<"AGING" | "STATEMENT" | "RECONCILIATION" | "PNL">(initialTab || "AGING");

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [reportType, setReportType] = useState<"CUSTOMER" | "SUPPLIER">("CUSTOMER");
  const [report, setReport] = useState<AgingReport | null>(null);
  const [reconciliation, setReconciliation] = useState<{
    matchedCount: number;
    unmatchedCount: number;
    statementBalance: number;
    ledgerBalance: number;
    difference: number;
    items: BankReconciliationItem[];
  } | null>(null);
  const [pnl, setPnl] = useState<PnLReport | null>(null);
  const [loading, setLoading] = useState(true);

  // Statement State
  const [partners, setPartners] = useState<any[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(null);
  const [statement, setStatement] = useState<PartnerStatement | null>(null);
  const [loadingStatement, setLoadingStatement] = useState(false);

  // Single Payment Modal
  const [selectedInvoice, setSelectedInvoice] = useState<AgingItem | null>(null);
  const [payAmount, setPayAmount] = useState<string>("");
  const [payMethod, setPayMethod] = useState<"CASH" | "BANK_TRANSFER" | "CHECK">("BANK_TRANSFER");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Credit Note / Devolución Modal
  const [creditNoteModalOpen, setCreditNoteModalOpen] = useState(false);
  const [creditInvoice, setCreditInvoice] = useState<AgingItem | null>(null);
  const [creditAmount, setCreditAmount] = useState<string>("");
  const [creditReason, setCreditReason] = useState<"DEVOLUCION_MERCANCIA" | "BONIFICACION_DESCUENTO" | "ERROR_FACTURACION">("DEVOLUCION_MERCANCIA");
  const [returnStock, setReturnStock] = useState(true);
  const [creditNotes, setCreditNotes] = useState("");
  const [submittingCreditNote, setSubmittingCreditNote] = useState(false);

  // Document Detail Modal State
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<StatementMovement | null>(null);
  const [financeChartTimeframe, setFinanceChartTimeframe] = useState<"MONTHLY" | "DAILY">("MONTHLY");

  const handleOpenDocumentDetail = (mov: StatementMovement) => {
    setSelectedMovement(mov);
    setDocModalOpen(true);
  };

  const handleOpenInvoiceDetailFromAging = (inv: AgingItem) => {
    const mov: StatementMovement = {
      id: `MOV-INV-${inv.invoiceId}`,
      date: inv.invoiceDate,
      type: "INVOICE",
      docNumber: inv.invoiceNumber,
      concept: `Factura Comercial a ${inv.partnerName}`,
      debit: inv.totalAmount,
      credit: 0,
      runningBalance: inv.amountRemaining,
      dueDate: inv.dueDate,
      isOverdue: inv.daysOverdue > 0,
      subtotal: Number((inv.totalAmount / 1.16).toFixed(2)),
      taxAmount: Number((inv.totalAmount - inv.totalAmount / 1.16).toFixed(2)),
      paymentMethod: inv.daysOverdue > 0 ? "Crédito Vencido (PPD)" : "Crédito Comercial (PPD)",
      accountingMove: `MOVE #${inv.invoiceId} (Cargo 105.01 Clientes / Abono 401.01 Ventas)`,
      lines: [
        {
          id: 1,
          productCode: "ART-COM",
          description: `Materiales y Productos Comerciales - ${inv.partnerName}`,
          qty: 1,
          uom: "LOT",
          unitPrice: inv.totalAmount,
          total: inv.totalAmount,
        },
      ],
    };
    setSelectedMovement(mov);
    setDocModalOpen(true);
  };

  // Reconciliation Interactive State
  const [selectedBankItem, setSelectedBankItem] = useState<BankReconciliationItem | null>(null);
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [autoMatching, setAutoMatching] = useState(false);
  const [selectedMatchOrigin, setSelectedMatchOrigin] = useState("");
  const [adjustAccountCode, setAdjustAccountCode] = useState("605.01");
  const [adjustAccountName, setAdjustAccountName] = useState("Gastos Financieros / Comisiones Bancarias");
  const [newBankItem, setNewBankItem] = useState({
    date: new Date().toISOString().slice(0, 10),
    concept: "",
    amount: "",
    type: "WITHDRAWAL" as "DEPOSIT" | "WITHDRAWAL",
  });

  const handleAutoMatch = async () => {
    if (!activeCompany) return;
    try {
      setAutoMatching(true);
      const res = await financeApi.autoMatchReconciliation(activeCompany.id);
      setReconciliation(res);
    } catch (err: any) {
      console.error("Error al auto-conciliar:", err);
    } finally {
      setAutoMatching(false);
    }
  };

  const handleUnmatch = async (itemId: string) => {
    if (!activeCompany) return;
    try {
      const res = await financeApi.unmatchReconciliation(activeCompany.id, itemId);
      setReconciliation(res);
    } catch (err: any) {
      console.error("Error al desconciliar:", err);
    }
  };

  const handleApplyAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany || !selectedBankItem) return;
    try {
      const res = await financeApi.adjustReconciliation(
        activeCompany.id,
        selectedBankItem.id,
        adjustAccountCode,
        adjustAccountName
      );
      setReconciliation(res);
      setAdjustModalOpen(false);
      setSelectedBankItem(null);
    } catch (err: any) {
      console.error("Error al aplicar ajuste:", err);
    }
  };

  const handleApplyManualMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany || !selectedBankItem || !selectedMatchOrigin) return;
    try {
      const res = await financeApi.matchReconciliation(
        activeCompany.id,
        selectedBankItem.id,
        selectedMatchOrigin
      );
      setReconciliation(res);
      setMatchModalOpen(false);
      setSelectedBankItem(null);
      setSelectedMatchOrigin("");
    } catch (err: any) {
      console.error("Error al vincular:", err);
    }
  };

  const handleCreateBankItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany || !newBankItem.concept || !newBankItem.amount) return;
    try {
      const res = await financeApi.importReconciliationItem(activeCompany.id, {
        date: newBankItem.date,
        concept: newBankItem.concept,
        amount: parseFloat(newBankItem.amount),
        type: newBankItem.type,
        matched: false,
      });
      setReconciliation(res);
      setImportModalOpen(false);
      setNewBankItem({
        date: new Date().toISOString().slice(0, 10),
        concept: "",
        amount: "",
        type: "WITHDRAWAL",
      });
    } catch (err: any) {
      console.error("Error al importar movimiento:", err);
    }
  };

  const loadData = async () => {
    const compId = activeCompany?.id || 13;
    try {
      setLoading(true);
      const [agingData, reconData, pnlData, partnersData] = await Promise.all([
        financeApi.getAgingReport(compId, reportType).catch(() => null),
        financeApi.getBankReconciliation(compId).catch(() => null),
        financeApi.getIncomeStatement(compId).catch(() => null),
        catalogApi.listPartners(compId).catch(() => []),
      ]);
      if (agingData) setReport(agingData);
      if (reconData) setReconciliation(reconData);
      if (pnlData) setPnl(pnlData);

      const seen = new Set<string>();
      const uniquePartners = (partnersData || []).filter((p: any) => {
        const nameKey = (p.name || p.fullName || "").trim().toLowerCase();
        const taxKey = (p.taxNbr || "").trim().toUpperCase();
        const key = nameKey ? `${nameKey}_${taxKey}` : String(p.id);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setPartners(uniquePartners);
      if (uniquePartners.length > 0) {
        setSelectedPartnerId((prev) => prev || uniquePartners[0].id);
      }
    } catch (err) {
      console.error("Error al cargar reportes financieros:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadStatement = async (partnerId: number) => {
    const compId = activeCompany?.id || 13;
    try {
      setLoadingStatement(true);
      const data = await financeApi.getPartnerStatement(partnerId, compId);
      setStatement(data);
    } catch (err) {
      console.error("Error al cargar estado de cuenta:", err);
    } finally {
      setLoadingStatement(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeCompany?.id, reportType]);

  useEffect(() => {
    if (activeTab === "STATEMENT" && partners.length === 0) {
      loadData();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedPartnerId && activeTab === "STATEMENT") {
      loadStatement(selectedPartnerId);
    }
  }, [selectedPartnerId, activeTab]);

  const handleOpenPayment = (inv: AgingItem) => {
    setSelectedInvoice(inv);
    setPayAmount(inv.amountRemaining.toString());
  };

  const handleOpenCreditNote = (inv: AgingItem) => {
    setCreditInvoice(inv);
    setCreditAmount(inv.amountRemaining.toString());
    setCreditReason("DEVOLUCION_MERCANCIA");
    setReturnStock(true);
    setCreditNotes("");
    setCreditNoteModalOpen(true);
  };

  const handleOpenStatementForPartner = (partnerId: number) => {
    setSelectedPartnerId(partnerId);
    setActiveTab("STATEMENT");
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !payAmount) return;

    try {
      setSubmittingPayment(true);
      await financeApi.registerPayment(selectedInvoice.invoiceId, {
        amount: parseFloat(payAmount),
        paymentMethod: payMethod,
      });
      setSelectedInvoice(null);
      loadData();
    } catch (err: any) {
      alert(`Error al registrar pago: ${err.message}`);
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleSubmitCreditNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditInvoice || !creditAmount) return;

    try {
      setSubmittingCreditNote(true);
      await financeApi.createCreditNote(creditInvoice.invoiceId, {
        creditAmount: parseFloat(creditAmount),
        reason: creditReason,
        returnStock,
        notes: creditNotes,
      });
      setCreditNoteModalOpen(false);
      setCreditInvoice(null);
      loadData();
      alert("¡Nota de Crédito y ajuste de inventario emitidos exitosamente!");
    } catch (err: any) {
      alert(`Error al emitir nota de crédito: ${err.message}`);
    } finally {
      setSubmittingCreditNote(false);
    }
  };

  const getBucketBadge = (bucket: AgingItem["bucket"]) => {
    switch (bucket) {
      case "CURRENT":
        return <Badge variant="success">Al Corriente (0-30d)</Badge>;
      case "DAYS_31_60":
        return <Badge variant="warning">Vencido (31-60d)</Badge>;
      case "DAYS_61_90":
        return <Badge variant="danger">Vencido (61-90d)</Badge>;
      case "OVER_90":
        return <Badge variant="danger" dot>Crítico (&gt;90d)</Badge>;
    }
  };

const FINANCE_CONFIGS: Record<
  "AGING" | "STATEMENT" | "RECONCILIATION" | "PNL",
  {
    title: string;
    subtitle: string;
    badge: string;
    badgeVariant: "primary" | "info" | "success" | "warning" | "danger" | "neutral";
  }
> = {
  AGING: {
    title: "Cuentas por Cobrar & Antigüedad de Saldos (Aging)",
    subtitle: "Cartera vencida por cubos de antigüedad (0-30d, 31-60d, 61-90d, >90d) y cobros aplicados",
    badge: "Finanzas & Contabilidad",
    badgeVariant: "primary",
  },
  STATEMENT: {
    title: "Estado de Cuenta Individual por Socio",
    subtitle: "Libro mayor auxiliar, límite de crédito, disponibilidad y semáforo de riesgo",
    badge: "Finanzas & Contabilidad",
    badgeVariant: "success",
  },
  RECONCILIATION: {
    title: "Conciliación Bancaria Automatizada",
    subtitle: "Emparejamiento de extractos bancarios contra libro diario contable",
    badge: "Finanzas & Contabilidad",
    badgeVariant: "warning",
  },
  PNL: {
    title: "Estado de Resultados (P&L)",
    subtitle: "Análisis financiero de ingresos, costos de venta, gastos operativos y margen neto",
    badge: "Finanzas & Contabilidad",
    badgeVariant: "neutral",
  },
};

  const currentConfig = FINANCE_CONFIGS[activeTab] || FINANCE_CONFIGS.AGING;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-heading font-bold text-slate-900 dark:text-white tracking-tight">
              {currentConfig.title}
            </h2>
            <Badge variant={currentConfig.badgeVariant}>{currentConfig.badge}</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {currentConfig.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} loading={loading} className="gap-1.5 text-xs font-semibold">
            <RefreshCw className="w-3.5 h-3.5" /> Actualizar
          </Button>
        </div>
      </div>

      {/* TAB 1: AGING REPORT */}
      {activeTab === "AGING" && (
        <div className="space-y-6">
          {/* Sub-toggle: Clientes vs Proveedores */}
          <div className="flex items-center justify-between">
            <div className="flex rounded-lg border border-slate-200 dark:border-white/10 p-0.5 bg-slate-50 dark:bg-etiserv-navyDark">
              <button
                onClick={() => setReportType("CUSTOMER")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  reportType === "CUSTOMER"
                    ? "bg-etiserv-blue text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Cuentas por Cobrar (CxC Clientes)
              </button>
              <button
                onClick={() => setReportType("SUPPLIER")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  reportType === "SUPPLIER"
                    ? "bg-etiserv-blue text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Cuentas por Pagar (CxP Proveedores)
              </button>
            </div>
            <span className="text-xs text-slate-400">
              Generado: {new Date(report?.generatedAt || Date.now()).toLocaleTimeString()}
            </span>
          </div>

          {/* Aging Buckets Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            <Card className="p-4 border-l-4 border-l-emerald-500">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Al Corriente (0-30d)</span>
              <div className="text-lg font-heading font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                ${report?.summary.current.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </div>
            </Card>

            <Card className="p-4 border-l-4 border-l-amber-500">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vencido (31-60d)</span>
              <div className="text-lg font-heading font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                ${report?.summary.days31to60.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </div>
            </Card>

            <Card className="p-4 border-l-4 border-l-orange-500">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vencido (61-90d)</span>
              <div className="text-lg font-heading font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                ${report?.summary.days61to90.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </div>
            </Card>

            <Card className="p-4 border-l-4 border-l-rose-500">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Crítico (&gt;90d)</span>
              <div className="text-lg font-heading font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                ${report?.summary.over90.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </div>
            </Card>

            <Card className="p-4 bg-slate-50 dark:bg-etiserv-navyDark">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cartera Total</span>
              <div className="text-lg font-heading font-bold text-etiserv-blue mt-1 tabular-nums">
                ${report?.summary.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </div>
            </Card>
          </div>

          {/* Aging Invoices Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-etiserv-navyDark text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-white/10">
                  <tr>
                    <th className="py-2.5 px-5">Folio Factura</th>
                    <th className="py-2.5 px-5">{reportType === "CUSTOMER" ? "Cliente" : "Proveedor"}</th>
                    <th className="py-2.5 px-5">Vencimiento</th>
                    <th className="py-2.5 px-5 text-right">Total Factura</th>
                    <th className="py-2.5 px-5 text-right">Saldo Pendiente</th>
                    <th className="py-2.5 px-5 text-center">Antigüedad</th>
                    <th className="py-2.5 px-5 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {report?.invoices.map((inv) => (
                    <tr key={inv.invoiceId} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-5">
                        <button
                          type="button"
                          onClick={() => handleOpenInvoiceDetailFromAging(inv)}
                          className="font-mono text-xs font-bold text-etiserv-blue hover:underline hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 text-left group"
                          title="Ver Detalle Completo del Documento"
                        >
                          <FileText className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" />
                          <span>{inv.invoiceNumber}</span>
                        </button>
                      </td>
                      <td className="py-3 px-5 font-semibold text-slate-900 dark:text-white">
                        {inv.partnerName}
                      </td>
                      <td className="py-3 px-5 text-slate-500 font-mono text-[11px]">
                        {inv.dueDate}
                      </td>
                      <td className="py-3 px-5 text-right font-medium text-slate-600 dark:text-slate-300 tabular-nums">
                        ${inv.totalAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-5 text-right font-bold text-slate-900 dark:text-white tabular-nums">
                        ${inv.amountRemaining.toFixed(2)}
                      </td>
                      <td className="py-3 px-5 text-center">
                        {getBucketBadge(inv.bucket)}
                      </td>
                      <td className="py-3 px-5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenPayment(inv)}
                            className="text-[10px] py-1 px-2.5"
                          >
                            {reportType === "CUSTOMER" ? "Cobrar" : "Pagar"}
                          </Button>
                          {reportType === "CUSTOMER" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenCreditNote(inv)}
                              className="text-[10px] py-1 px-2 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-1"
                              title="Emitir Nota de Crédito / Devolución"
                            >
                              <RotateCcw className="w-3 h-3" /> Nota Crédito
                            </Button>
                          )}
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenStatementForPartner(inv.partnerId)}
                            className="text-[10px] py-1 px-2 flex items-center gap-1"
                            title="Ver Estado de Cuenta Completo"
                          >
                            <FileText className="w-3 h-3" /> Edo. Cuenta
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: PARTNER ACCOUNT STATEMENT */}
      {activeTab === "STATEMENT" && (
        <div className="space-y-6">
          {/* Partner Selector Header */}
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1 max-w-md">
                <Autocomplete
                  label="Cliente o Proveedor (Búsqueda Inteligente)"
                  placeholder="Selecciona o busca un cliente/proveedor..."
                  searchPlaceholder="Escribe nombre, empresa, RFC o razón social..."
                  items={partners.map((p) => ({
                    id: p.id,
                    title: p.name || p.fullName || `Socio #${p.id}`,
                    subtitle: `RFC: ${p.taxNbr || "Sin RFC"} • ${p.isCustomer ? "Cliente Comercial" : "Proveedor"}`,
                    badge: p.isCustomer ? "Cliente" : "Proveedor",
                    icon: "building" as const,
                  }))}
                  value={selectedPartnerId || ""}
                  onChange={(item) => {
                    setSelectedPartnerId(Number(item.id));
                  }}
                  required
                />
              </div>

              {statement && (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Condición Crediticia</span>
                    <Badge
                      variant={
                        statement.riskStatus === "NORMAL"
                          ? "success"
                          : statement.riskStatus === "WARNING"
                          ? "warning"
                          : "danger"
                      }
                      dot
                    >
                      {statement.riskStatus === "NORMAL"
                        ? "Línea de Crédito Saludable"
                        : statement.riskStatus === "WARNING"
                        ? "Atención: Límite Próximo (>80%)"
                        : "⛔ Bloqueo / Crédito Excedido"}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {loadingStatement && (
            <Card className="p-10 text-center text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-etiserv-blue" />
              <span>Cargando libro mayor y métricas de crédito...</span>
            </Card>
          )}

          {!loadingStatement && statement && (
            <div className="space-y-6">
              {/* Partner Financial Header Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <Card className="p-4 border-l-4 border-l-etiserv-blue">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Límite de Crédito
                    </span>
                    <Badge variant="neutral" className="text-[10px]">
                      {statement.creditDays > 0 ? `${statement.creditDays} días` : "Contado"}
                    </Badge>
                  </div>
                  <div className="text-xl font-heading font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                    ${statement.creditLimit.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Tarifa: {statement.priceListCode || "PUBLIC"}
                  </span>
                </Card>

                <Card className="p-4 border-l-4 border-l-rose-500">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Saldo Deudor Actual (CxC)
                  </span>
                  <div className="text-xl font-heading font-bold text-rose-600 dark:text-rose-400 mt-1 tabular-nums">
                    ${statement.currentBalance.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="mt-2 w-full bg-slate-100 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full ${
                        statement.creditUsagePct > 100
                          ? "bg-rose-500"
                          : statement.creditUsagePct > 80
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min(100, statement.creditUsagePct)}%` }}
                    />
                  </div>
                </Card>

                <Card className="p-4 border-l-4 border-l-emerald-500">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Crédito Disponible
                  </span>
                  <div className="text-xl font-heading font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                    ${statement.availableCredit.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    {statement.creditUsagePct}% utilizado
                  </span>
                </Card>

                <Card className="p-4 border-l-4 border-l-amber-500">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Saldo Vencido
                  </span>
                  <div className={`text-xl font-heading font-bold mt-1 tabular-nums ${statement.overdueBalance > 0 ? "text-amber-500" : "text-slate-900 dark:text-white"}`}>
                    ${statement.overdueBalance.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    {statement.overdueBalance > 0 ? "⚠️ Exige gestión de cobro" : "Sin morosidad"}
                  </span>
                </Card>
              </div>

              {/* HISTORIAL DE VENTAS 6 MESES & DIAGNÓSTICO CREDITICIO */}
              {statement.creditHealth && (
                <Card className="p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-etiserv-blue/10 text-etiserv-blue dark:bg-etiserv-blue/20">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                            {statement.isSupplier
                              ? financeChartTimeframe === "MONTHLY"
                                ? "Historial de Compras Semestral (6 Meses)"
                                : "Evolución Diaria de Compras (Últimos 30 Días)"
                              : financeChartTimeframe === "MONTHLY"
                                ? "Historial de Facturación Semestral (6 Meses)"
                                : "Evolución Diaria de Ventas (Últimos 30 Días)"}
                          </h4>
                          <Badge
                            variant={
                              statement.creditHealth.trend === "GROWING"
                                ? "success"
                                : statement.creditHealth.trend === "COOLING_DOWN"
                                ? "warning"
                                : statement.creditHealth.trend === "INACTIVE"
                                ? "danger"
                                : "primary"
                            }
                            className="text-[10px]"
                          >
                            {statement.creditHealth.trend === "GROWING" && (statement.isSupplier ? "🚀 Compras al Alza (+)" : "🚀 Cuenta en Expansión (+)")}
                            {statement.creditHealth.trend === "COOLING_DOWN" && (statement.isSupplier ? "📉 Desacelerando Compras (-)" : "📉 Desacelerando / Aflojando (-)")}
                            {statement.creditHealth.trend === "INACTIVE" && "⛔ Inactivo con Saldo"}
                            {statement.creditHealth.trend === "STABLE" && "⚖️ Abastecimiento Estable"}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {financeChartTimeframe === "MONTHLY" ? (
                            <>
                              {statement.isSupplier ? "Compra promedio:" : "Promedio mensual:"}{" "}
                              <strong className="font-mono text-slate-900 dark:text-white">
                                ${statement.creditHealth.avgMonthlySales.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                              </strong>{" "}
                              • Cobertura Límite: <strong className="font-mono">{statement.creditHealth.creditCoverageRatio}x</strong>
                            </>
                          ) : (
                            <>
                              Frecuencia de pedidos: <strong className="font-mono text-slate-900 dark:text-white">Cada {statement.creditHealth.avgOrderFrequencyDays} días</strong> • Ticket Promedio: <strong className="font-mono text-slate-900 dark:text-white">${statement.creditHealth.avgTicket.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</strong>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* TOGGLE BUTTONS */}
                      <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-white/10 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setFinanceChartTimeframe("MONTHLY")}
                          className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                            financeChartTimeframe === "MONTHLY"
                              ? "bg-white dark:bg-[#071C33] text-etiserv-blue shadow-xs"
                              : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          📆 6 Meses
                        </button>
                        <button
                          type="button"
                          onClick={() => setFinanceChartTimeframe("DAILY")}
                          className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                            financeChartTimeframe === "DAILY"
                              ? "bg-white dark:bg-[#071C33] text-etiserv-blue shadow-xs"
                              : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          📅 30 Días (Día a Día)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* VISTA 1: MENSUAL (6 MESES) */}
                  {financeChartTimeframe === "MONTHLY" && (() => {
                    const maxVal = Math.max(
                      ...statement.creditHealth!.salesHistory.map((s) => s.totalSales),
                      statement.creditLimit || 1,
                      1000
                    );

                    return (
                      <div className="space-y-3">
                        <div className="grid grid-cols-6 gap-3 items-end h-32 pt-6 px-3 bg-slate-50 dark:bg-[#071C33] rounded-xl border border-slate-200/80 dark:border-white/5 relative">
                          {statement.creditLimit > 0 && statement.creditLimit <= maxVal * 1.2 && (
                            <div
                              className="absolute left-3 right-3 border-b border-dashed border-rose-400/50 z-0 flex justify-end"
                              style={{ bottom: `${Math.min(95, (statement.creditLimit / maxVal) * 80)}%` }}
                              title={`Límite de Crédito: $${statement.creditLimit.toLocaleString("es-MX")}`}
                            >
                              <span className="text-[9px] font-mono text-rose-500 bg-white/90 dark:bg-[#071C33]/90 px-1.5 py-0.5 rounded shadow-xs -translate-y-2">
                                Línea Crédito: ${statement.creditLimit.toLocaleString("es-MX")}
                              </span>
                            </div>
                          )}

                          {statement.creditHealth!.salesHistory.map((item, i) => {
                            const pct = Math.max(12, Math.min(100, (item.totalSales / maxVal) * 100));
                            const isLatest = i === 5;
                            const isDown = isLatest && statement.creditHealth!.trend === "COOLING_DOWN";
                            const isUp = isLatest && statement.creditHealth!.trend === "GROWING";

                            return (
                              <div key={item.month} className="flex flex-col items-center h-full justify-end group relative z-10">
                                <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-mono py-1 px-2 rounded-lg pointer-events-none whitespace-nowrap shadow-xl z-20">
                                  {item.monthLabel}: ${item.totalSales.toLocaleString("es-MX")} ({item.invoiceCount} docs)
                                </div>

                                <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-200 mb-1.5 group-hover:text-etiserv-blue">
                                  ${Math.round(item.totalSales / 1000)}k
                                </span>

                                <div className="w-full max-w-[42px] bg-slate-200/60 dark:bg-white/5 rounded-t-lg h-full flex items-end">
                                  <div
                                    className={`w-full rounded-t-lg transition-all duration-500 ${
                                      isDown
                                        ? "bg-gradient-to-t from-amber-500 to-amber-400 group-hover:from-amber-600 group-hover:to-amber-500 shadow-xs"
                                        : isUp
                                        ? "bg-gradient-to-t from-emerald-600 to-emerald-400 group-hover:from-emerald-700 group-hover:to-emerald-500 shadow-xs"
                                        : "bg-gradient-to-t from-etiserv-blue to-cyan-500 group-hover:from-blue-700 group-hover:to-cyan-400"
                                    }`}
                                    style={{ height: `${pct}%` }}
                                  />
                                </div>

                                <span className={`text-[11px] font-semibold mt-2 ${isLatest ? "text-etiserv-blue font-bold" : "text-slate-500"}`}>
                                  {item.shortLabel}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* VISTA 2: DIARIA (30 DÍAS) */}
                  {financeChartTimeframe === "DAILY" && (() => {
                    const daily = statement.creditHealth!.dailyHistory || [];
                    const maxVal = Math.max(...daily.map((d) => d.totalSales), 5000);

                    return (
                      <div className="space-y-3">
                        <div className="flex items-end gap-1.5 h-36 pt-6 px-3 bg-slate-50 dark:bg-[#071C33] rounded-xl border border-slate-200/80 dark:border-white/5 overflow-x-auto">
                          {daily.map((d) => {
                            const pct = d.totalSales > 0 ? Math.max(15, Math.min(100, (d.totalSales / maxVal) * 100)) : 0;
                            const hasActivity = d.totalSales > 0;

                            return (
                              <div
                                key={d.date}
                                className="flex flex-col items-center h-full justify-end group relative min-w-[24px] flex-1"
                              >
                                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-mono py-1 px-2.5 rounded-lg pointer-events-none whitespace-nowrap shadow-2xl z-30">
                                  <strong>{d.dayLabel} ({d.weekday}):</strong> {hasActivity ? `$${d.totalSales.toLocaleString("es-MX")} (${d.docNumbers.join(", ")})` : "Sin operaciones"}
                                </div>

                                <div className="w-full max-w-[14px] bg-slate-200/60 dark:bg-white/5 rounded-t-sm h-full flex items-end">
                                  {hasActivity && (
                                    <div
                                      className="w-full rounded-t-sm bg-gradient-to-t from-etiserv-blue to-teal-400 group-hover:from-blue-600 group-hover:to-teal-300 transition-all shadow-xs"
                                      style={{ height: `${pct}%` }}
                                    />
                                  )}
                                </div>

                                <span className={`text-[9px] font-mono mt-1.5 ${hasActivity ? "text-etiserv-blue font-bold" : "text-slate-400"}`}>
                                  {d.date.slice(8, 10)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Recommendation Note */}
                  <div className="flex items-center gap-2 p-3 rounded-xl text-xs bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200">
                    <span className="text-base shrink-0">
                      {statement.creditHealth.recommendation === "COMMERCIAL_ACTION_REQUIRED" ? "⚠️" : statement.creditHealth.recommendation === "INCREASE_LIMIT" ? "🚀" : statement.creditHealth.recommendation === "REDUCE_LIMIT" ? "🟡" : "💡"}
                    </span>
                    <div className="space-y-0.5">
                      <span className="font-bold block text-slate-900 dark:text-white">
                        Diagnóstico de Comportamiento & Crédito:
                      </span>
                      <p className="text-slate-600 dark:text-slate-300">
                        {statement.creditHealth.recommendationText}
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Detailed Movements Table */}
              <Card className="overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
                  <div>
                    <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                      Libro Mayor & Movimientos Históricos de {statement.partnerName}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      RFC: {statement.taxNbr} | Email: {statement.email || "Sin email"} | Tel: {statement.phone || "Sin teléfono"}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.print()}
                    className="text-xs gap-1.5 hidden sm:flex"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" /> Imprimir Estado de Cuenta
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-etiserv-navyDark text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-white/10">
                      <tr>
                        <th className="py-2.5 px-4">Fecha</th>
                        <th className="py-2.5 px-4">Tipo</th>
                        <th className="py-2.5 px-4">Folio Doc.</th>
                        <th className="py-2.5 px-4">Concepto / Descripción</th>
                        <th className="py-2.5 px-4 text-right">Cargo (+)</th>
                        <th className="py-2.5 px-4 text-right">Abono (-)</th>
                        <th className="py-2.5 px-4 text-right">Saldo Acumulado</th>
                        <th className="py-2.5 px-4 text-center">Vencimiento</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {statement.movements.map((mov) => (
                        <tr
                          key={mov.id}
                          onClick={() => handleOpenDocumentDetail(mov)}
                          className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 cursor-pointer transition-colors group"
                        >
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{mov.date}</td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={
                                mov.type === "INVOICE"
                                  ? "primary"
                                  : mov.type === "PAYMENT"
                                  ? "success"
                                  : "neutral"
                              }
                              className="text-[10px]"
                            >
                              {mov.type === "INVOICE" ? "Factura" : mov.type === "PAYMENT" ? "Pago / Cobro" : "Nota Crédito"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDocumentDetail(mov);
                              }}
                              className="font-mono font-bold text-xs text-etiserv-blue group-hover:underline hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 text-left"
                              title="Ver Detalle Completo del Documento"
                            >
                              <FileText className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" />
                              <span>{mov.docNumber}</span>
                            </button>
                          </td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300 max-w-xs truncate font-medium" title={mov.concept}>
                            {mov.concept}
                          </td>
                          <td className="py-3 px-4 text-right font-medium tabular-nums text-slate-900 dark:text-white">
                            {mov.debit > 0 ? `$${mov.debit.toFixed(2)}` : "—"}
                          </td>
                          <td className="py-3 px-4 text-right font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                            {mov.credit > 0 ? `-$${mov.credit.toFixed(2)}` : "—"}
                          </td>
                          <td className="py-3 px-4 text-right font-bold tabular-nums text-slate-900 dark:text-white">
                            ${mov.runningBalance.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-[11px]">
                            {mov.dueDate ? (
                              <span className={mov.isOverdue ? "text-rose-600 font-bold" : "text-slate-500"}>
                                {mov.dueDate} {mov.isOverdue && "⚠️"}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50/70 dark:bg-etiserv-navyDark/60 font-bold border-t border-slate-200 dark:border-white/10">
                      <tr>
                        <td colSpan={4} className="py-3 px-4 text-right text-slate-500">
                          TOTALES DEL PERIODO:
                        </td>
                        <td className="py-3 px-4 text-right text-slate-900 dark:text-white tabular-nums">
                          ${statement.summary.totalInvoiced.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 tabular-nums">
                          -${(statement.summary.totalPaid + statement.summary.totalCredited).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right text-etiserv-blue text-sm tabular-nums">
                          ${statement.summary.netBalance.toFixed(2)}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BANK RECONCILIATION */}
      {activeTab === "RECONCILIATION" && (
        <div className="space-y-6">
          {/* Step-by-Step Educational Workflow Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-emerald-500/10 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-etiserv-blue" />
              <h3 className="text-sm font-bold font-heading text-slate-900 dark:text-white">
                ¿Cómo funciona la Conciliación Bancaria en Axelor PyME?
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white/80 dark:bg-[#071C33]/80 border border-slate-200/50 dark:border-white/5 shadow-xs">
                <span className="w-5 h-5 rounded-full bg-etiserv-blue text-white flex items-center justify-center font-bold text-[10px] mb-1.5">
                  1
                </span>
                <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                  1. Carga de Extracto
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Registra los depósitos y retiros reportados por el banco.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/80 dark:bg-[#071C33]/80 border border-slate-200/50 dark:border-white/5 shadow-xs">
                <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-[10px] mb-1.5">
                  2
                </span>
                <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                  2. Auto-Cruce Inteligente
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  El sistema cruza cobros CxC y pagos de gastos con el extracto.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/80 dark:bg-[#071C33]/80 border border-slate-200/50 dark:border-white/5 shadow-xs">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-[10px] mb-1.5">
                  3
                </span>
                <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                  3. Pólizas de Ajuste
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Genera en 1 clic la póliza de comisiones bancarias o intereses.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/80 dark:bg-[#071C33]/80 border border-slate-200/50 dark:border-white/5 shadow-xs">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[10px] mb-1.5">
                  4
                </span>
                <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                  4. Saldo Cuadrado ($0.00)
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  La cuenta queda 100% auditada y conciliada con el Libro Mayor.
                </p>
              </div>
            </div>
          </div>

          {/* Action Bar & Bank Account Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-etiserv-navyDark border border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-etiserv-blue/10 text-etiserv-blue flex items-center justify-center">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Cuenta Bancaria Operativa</span>
                <span className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                  102.01 - BBVA Bancomer Maestra (Cta: 0192837465 - MXN)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setImportModalOpen(true)}
                className="text-xs gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Agregar Movimiento Bancario
              </Button>
              <Button
                variant="primary"
                size="sm"
                glow
                loading={autoMatching}
                onClick={handleAutoMatch}
                className="text-xs gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                <Zap className="w-3.5 h-3.5" /> Auto-Conciliar Inteligente
              </Button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 border-l-4 border-l-etiserv-blue">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                1. Saldo Extracto Bancario
              </span>
              <div className="text-xl font-heading font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                ${reconciliation?.statementBalance.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Reportado por el Banco</span>
            </Card>

            <Card className="p-4 border-l-4 border-l-indigo-500">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                2. Saldo Contable (Libro Mayor)
              </span>
              <div className="text-xl font-heading font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                ${reconciliation?.ledgerBalance.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Cuenta 102.01 Bancos</span>
            </Card>

            <Card
              className={`p-4 border-l-4 ${
                reconciliation?.difference === 0 ? "border-l-emerald-500 bg-emerald-500/5" : "border-l-rose-500 bg-rose-500/5"
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                3. Diferencia de Conciliación
              </span>
              <div
                className={`text-xl font-heading font-bold mt-1 tabular-nums ${
                  reconciliation?.difference === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"
                }`}
              >
                ${reconciliation?.difference.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] font-semibold mt-0.5 block">
                {reconciliation?.difference === 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> ¡Cuenta 100% Cuadrada!
                  </span>
                ) : (
                  <span className="text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Requiere Póliza de Ajuste
                  </span>
                )}
              </span>
            </Card>
          </div>

          {/* Interactive Movements Table */}
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                  Movimientos del Extracto Bancario vs ERP
                </h3>
                <p className="text-xs text-slate-400">
                  Haz clic en las acciones para conciliar, vincular pólizas o generar ajustes automáticos.
                </p>
              </div>
              <Badge variant={reconciliation?.unmatchedCount === 0 ? "success" : "warning"} dot>
                {reconciliation?.matchedCount} Conciliados / {reconciliation?.unmatchedCount} Pendientes
              </Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-etiserv-navyDark text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-white/10">
                  <tr>
                    <th className="py-2.5 px-4">Fecha</th>
                    <th className="py-2.5 px-4">Tipo</th>
                    <th className="py-2.5 px-4">Concepto Bancario (Extracto)</th>
                    <th className="py-2.5 px-4 text-right">Monto</th>
                    <th className="py-2.5 px-4">Asiento Cruzado ERP</th>
                    <th className="py-2.5 px-4 text-center">Estado</th>
                    <th className="py-2.5 px-4 text-center">Acciones de Conciliación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {reconciliation?.items.map((item) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors ${
                        !item.matched ? "bg-amber-500/[0.03]" : ""
                      }`}
                    >
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">{item.date}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={item.type === "DEPOSIT" ? "success" : "neutral"}
                          className="text-[9px] py-0.5 px-1.5"
                        >
                          {item.type === "DEPOSIT" ? "Depósito (+)" : "Retiro (-)"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white max-w-xs">
                        {item.concept}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-bold tabular-nums ${
                          item.type === "DEPOSIT"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-slate-900 dark:text-white"
                        }`}
                      >
                        {item.type === "WITHDRAWAL" ? "-" : ""}${item.amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                        {item.matchedMoveOrigin ? (
                          <span className="flex items-center gap-1 text-etiserv-blue font-semibold">
                            <CheckSquare className="w-3 h-3 text-emerald-500" />
                            {item.matchedMoveOrigin}
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 font-sans italic flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Sin cruce contable
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={item.matched ? "success" : "warning"} dot>
                          {item.matched ? "Conciliado" : "Pendiente"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.matched ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnmatch(item.id)}
                            className="text-[10px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 py-1 px-2 gap-1"
                            title="Desconciliar movimiento"
                          >
                            <Unlock className="w-3 h-3" /> Desconciliar
                          </Button>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              variant="primary"
                              size="sm"
                              glow
                              onClick={() => {
                                setSelectedBankItem(item);
                                setAdjustModalOpen(true);
                              }}
                              className="text-[10px] py-1 px-2.5 bg-amber-600 hover:bg-amber-700 text-white gap-1"
                              title="Crear póliza de ajuste automático para comisión o gasto"
                            >
                              <Zap className="w-3 h-3" /> Póliza de Ajuste
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedBankItem(item);
                                setSelectedMatchOrigin(`Gasto Operativo / Factura $${item.amount.toFixed(2)}`);
                                setMatchModalOpen(true);
                              }}
                              className="text-[10px] py-1 px-2 gap-1"
                              title="Vincular a póliza o factura existente"
                            >
                              <Link2 className="w-3 h-3" /> Cruzar
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: INCOME STATEMENT (P&L) */}
      {activeTab === "PNL" && pnl && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ingresos Totales</span>
              <div className="text-xl font-heading font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                ${pnl.revenue.totalRevenue.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </div>
            </Card>
            <Card className="p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Utilidad Bruta</span>
              <div className="text-xl font-heading font-bold text-emerald-600 mt-1 tabular-nums">
                ${pnl.grossProfit.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-slate-400 font-semibold mt-0.5 block">
                Margen Bruto: {pnl.grossMarginPct}%
              </span>
            </Card>
            <Card className="p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gastos Operativos</span>
              <div className="text-xl font-heading font-bold text-rose-600 mt-1 tabular-nums">
                ${pnl.operatingExpenses.totalExpenses.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </div>
            </Card>
            <Card className="p-4 bg-slate-50 dark:bg-etiserv-navyDark border-l-4 border-l-etiserv-blue">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Utilidad Neta del Mes</span>
              <div className="text-xl font-heading font-bold text-etiserv-blue mt-1 tabular-nums">
                ${pnl.netProfit.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
                Margen Neto: {pnl.netMarginPct}%
              </span>
            </Card>
          </div>

          <Card className="p-6 max-w-3xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10 mb-4">
              <div>
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                  Estado de Resultados Integral
                </h3>
                <span className="text-xs text-slate-400">{pnl.period}</span>
              </div>
              <Badge variant="primary">En Tiempo Real</Badge>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-white/5 font-semibold">
                <span className="text-slate-800 dark:text-slate-200">(+) Ventas de Mercancías</span>
                <span className="tabular-nums">${pnl.revenue.sales.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-white/5 text-rose-600 font-semibold">
                <span>(-) Costo de Ventas / PMP</span>
                <span className="tabular-nums">-${pnl.cogs.costOfGoodsSold.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between py-2 bg-emerald-50/50 dark:bg-emerald-950/20 px-3 rounded-lg font-bold text-emerald-700 dark:text-emerald-300">
                <span>(=) UTILIDAD BRUTA</span>
                <span className="tabular-nums">${pnl.grossProfit.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="pt-2 pl-4 space-y-1.5 text-slate-500">
                <div className="flex justify-between">
                  <span>• Nómina y Sueldos</span>
                  <span className="tabular-nums">${pnl.operatingExpenses.salaries.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>• Renta y Alquileres</span>
                  <span className="tabular-nums">${pnl.operatingExpenses.rent.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>• Servicios y Electricidad</span>
                  <span className="tabular-nums">${pnl.operatingExpenses.services.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="flex justify-between py-2.5 bg-blue-50/50 dark:bg-blue-950/20 px-3 rounded-lg font-bold text-base text-etiserv-blue border border-blue-200 dark:border-blue-800/40 mt-3">
                <span>(=) UTILIDAD NETA DE OPERACIÓN</span>
                <span className="tabular-nums">${pnl.netProfit.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Payment Modal */}
      <Modal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        title={`Registrar ${reportType === "CUSTOMER" ? "Cobro de Cartera" : "Pago a Proveedor"}`}
        maxWidth="md"
      >
        <form onSubmit={handleSubmitPayment} className="space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-etiserv-navyDark rounded-lg space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Folio:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-white">{selectedInvoice?.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Saldo Pendiente:</span>
              <span className="font-bold text-rose-600">${selectedInvoice?.amountRemaining.toFixed(2)}</span>
            </div>
          </div>

          <Input
            label="Monto a Aplicar ($ MXN)"
            type="number"
            step="0.01"
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
            required
            autoFocus
          />

          <Select
            label="Método de Pago"
            value={payMethod}
            onChange={(e) => setPayMethod(e.target.value as any)}
          >
            <option value="BANK_TRANSFER">Transferencia Electrónica (SPEI)</option>
            <option value="CASH">Efectivo (Caja Chica)</option>
            <option value="CHECK">Cheque Nominativo</option>
          </Select>

          <div className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
            <Button variant="outline" className="flex-1" type="button" onClick={() => setSelectedInvoice(null)}>
              Cancelar
            </Button>
            <Button variant="primary" glow className="flex-1" type="submit" loading={submittingPayment}>
              Confirmar Asiento
            </Button>
          </div>
        </form>
      </Modal>

      {/* Credit Note / Devolución Modal */}
      <Modal
        isOpen={creditNoteModalOpen}
        onClose={() => {
          setCreditNoteModalOpen(false);
          setCreditInvoice(null);
        }}
        title="Emitir Nota de Crédito / Devolución a Cliente"
        maxWidth="md"
      >
        <form onSubmit={handleSubmitCreditNote} className="space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-etiserv-navyDark rounded-lg space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Factura Origen:</span>
              <span className="font-mono font-bold text-etiserv-blue">{creditInvoice?.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Cliente:</span>
              <span className="font-semibold text-slate-800 dark:text-white">{creditInvoice?.partnerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Saldo Actual por Cobrar:</span>
              <span className="font-bold text-rose-600">${creditInvoice?.amountRemaining.toFixed(2)}</span>
            </div>
          </div>

          <Input
            label="Monto a Acreditar / Bonificar ($)"
            type="number"
            step="0.01"
            value={creditAmount}
            onChange={(e) => setCreditAmount(e.target.value)}
            required
            autoFocus
          />

          <Select
            label="Motivo de la Nota de Crédito"
            value={creditReason}
            onChange={(e) => setCreditReason(e.target.value as any)}
          >
            <option value="DEVOLUCION_MERCANCIA">Devolución Física de Mercancía</option>
            <option value="BONIFICACION_DESCUENTO">Descuento o Bonificación Comercial</option>
            <option value="ERROR_FACTURACION">Corrección / Error de Facturación</option>
          </Select>

          <div className="p-3 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={returnStock}
                onChange={(e) => setReturnStock(e.target.checked)}
                className="rounded text-etiserv-blue focus:ring-etiserv-blue"
              />
              <span>Reingresar automáticamente las existencias devueltas al almacén</span>
            </label>
          </div>

          <Input
            label="Observaciones / Justificación"
            placeholder="Ej: Cliente regresó 5 unidades por cambio de modelo..."
            value={creditNotes}
            onChange={(e) => setCreditNotes(e.target.value)}
          />

          <div className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
            <Button
              variant="outline"
              className="flex-1"
              type="button"
              onClick={() => {
                setCreditNoteModalOpen(false);
                setCreditInvoice(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              glow
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
              type="submit"
              loading={submittingCreditNote}
            >
              Emitir Nota de Crédito
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 1: Póliza de Ajuste Automático (Comisiones / Intereses) */}
      <Modal
        isOpen={adjustModalOpen}
        onClose={() => {
          setAdjustModalOpen(false);
          setSelectedBankItem(null);
        }}
        title="Crear Póliza de Ajuste Contable & Conciliar"
        maxWidth="md"
      >
        {selectedBankItem && (
          <form onSubmit={handleApplyAdjustment} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1.5">
              <span className="font-bold text-amber-900 dark:text-amber-300 block">
                Movimiento Bancario a Conciliar:
              </span>
              <div className="flex justify-between font-mono">
                <span className="text-slate-600 dark:text-slate-300">{selectedBankItem.concept}</span>
                <span className="font-bold text-rose-600">${selectedBankItem.amount.toFixed(2)}</span>
              </div>
              <span className="text-[11px] text-slate-400 block">
                Fecha del extracto: {selectedBankItem.date}
              </span>
            </div>

            <Select
              label="Cuenta Contable de Gasto / Ajuste"
              value={adjustAccountCode}
              onChange={(e) => {
                const code = e.target.value;
                setAdjustAccountCode(code);
                if (code === "605.01") setAdjustAccountName("Gastos Financieros / Comisiones Bancarias");
                else if (code === "601.01") setAdjustAccountName("Gastos Administrativos Generales");
                else if (code === "701.01") setAdjustAccountName("Intereses Ganados / Otros Productos");
                else setAdjustAccountName("Ajuste de Conciliación Bancaria");
              }}
            >
              <option value="605.01">605.01 - Gastos Financieros (Comisiones e IVA Bancario)</option>
              <option value="601.01">601.01 - Gastos de Administración</option>
              <option value="701.01">701.01 - Productos Financieros (Intereses a Favor)</option>
              <option value="107.01">107.01 - Deudores Diversos / Traspaso Cuentas</option>
            </Select>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#061527] border border-slate-200 dark:border-white/10 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Previsualización de la Póliza Resultante
              </span>
              <div className="font-mono text-[11px] space-y-0.5 text-slate-700 dark:text-slate-300">
                <div className="text-blue-600 dark:text-blue-400 font-bold">
                  • CARGO: {adjustAccountCode} ({adjustAccountName}) $\rightarrow$ ${selectedBankItem.amount.toFixed(2)}
                </div>
                <div className="text-emerald-600 dark:text-emerald-400 font-bold">
                  • ABONO: 102.01 (Bancos BBVA Maestra) $\rightarrow$ ${selectedBankItem.amount.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2 border-t border-slate-100 dark:border-white/10">
              <Button
                variant="outline"
                className="flex-1"
                type="button"
                onClick={() => {
                  setAdjustModalOpen(false);
                  setSelectedBankItem(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                glow
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                type="submit"
              >
                Generar Póliza & Conciliar
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 2: Vincular / Cruzar con Póliza Existente */}
      <Modal
        isOpen={matchModalOpen}
        onClose={() => {
          setMatchModalOpen(false);
          setSelectedBankItem(null);
        }}
        title="Vincular Movimiento Bancario a Póliza / Factura"
        maxWidth="md"
      >
        {selectedBankItem && (
          <form onSubmit={handleApplyManualMatch} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs">
              <span className="font-bold text-slate-900 dark:text-white block mb-1">
                Movimiento del Banco:
              </span>
              <div className="flex justify-between font-mono">
                <span>{selectedBankItem.concept}</span>
                <span className="font-bold text-etiserv-blue">${selectedBankItem.amount.toFixed(2)}</span>
              </div>
            </div>

            <Input
              label="Referencia / Póliza de Cruce Contable"
              placeholder="Ej: Factura #104 / Pago SPEI / Gasto Operativo"
              value={selectedMatchOrigin}
              onChange={(e) => setSelectedMatchOrigin(e.target.value)}
              required
            />

            <p className="text-[11px] text-slate-400">
              Al vincular, el movimiento cambiará a estado <strong>Conciliado</strong> y la diferencia se ajustará.
            </p>

            <div className="flex gap-2.5 pt-2 border-t border-slate-100 dark:border-white/10">
              <Button
                variant="outline"
                className="flex-1"
                type="button"
                onClick={() => {
                  setMatchModalOpen(false);
                  setSelectedBankItem(null);
                }}
              >
                Cancelar
              </Button>
              <Button variant="primary" glow className="flex-1" type="submit">
                Vincular y Conciliar
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 3: Agregar Movimiento a Extracto Bancario */}
      <Modal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="Registrar Movimiento en Extracto Bancario"
        maxWidth="md"
      >
        <form onSubmit={handleCreateBankItem} className="space-y-4">
          <Input
            label="Fecha del Movimiento"
            type="date"
            value={newBankItem.date}
            onChange={(e) => setNewBankItem({ ...newBankItem, date: e.target.value })}
            required
          />

          <Select
            label="Tipo de Movimiento Bancario"
            value={newBankItem.type}
            onChange={(e) => setNewBankItem({ ...newBankItem, type: e.target.value as any })}
          >
            <option value="WITHDRAWAL">Cargo / Retiro Bancario (-)</option>
            <option value="DEPOSIT">Abono / Depósito Bancario (+)</option>
          </Select>

          <Input
            label="Concepto según Estado de Cuenta"
            placeholder="Ej: Transferencia SPEI Recibida / Pago de Servicios..."
            value={newBankItem.concept}
            onChange={(e) => setNewBankItem({ ...newBankItem, concept: e.target.value })}
            required
          />

          <Input
            label="Monto del Movimiento"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={newBankItem.amount}
            onChange={(e) => setNewBankItem({ ...newBankItem, amount: e.target.value })}
            required
          />

          <div className="flex gap-2.5 pt-2 border-t border-slate-100 dark:border-white/10">
            <Button
              variant="outline"
              className="flex-1"
              type="button"
              onClick={() => setImportModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button variant="primary" glow className="flex-1" type="submit">
              Agregar al Extracto
            </Button>
          </div>
        </form>
      </Modal>

      {/* Document Detail Modal */}
      <DocumentDetailModal
        isOpen={docModalOpen}
        onClose={() => {
          setDocModalOpen(false);
          setSelectedMovement(null);
        }}
        movement={selectedMovement}
        partnerName={statement?.partnerName || selectedInvoice?.partnerName || "Cliente Comercial"}
        partnerTaxId={statement?.taxNbr || "XAXX010101000"}
        companyName={activeCompany?.name || "Distribuidora Nacional PyME S.A."}
        companyTaxId={activeCompany?.taxId || "DNP180520AB1"}
        currencySymbol="$"
      />
    </div>
  );
};
