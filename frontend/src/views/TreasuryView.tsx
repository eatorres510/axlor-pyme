import React, { useEffect, useState } from "react";
import {
  Landmark,
  Coins,
  RefreshCw,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Search,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Layers,
  Calculator,
  ShieldCheck,
  Building2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Scale,
  Calendar,
  Filter,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Printer,
  Download,
} from "lucide-react";
import { useCompany } from "../context/CompanyContext";
import { treasuryApi } from "../api/treasuryApi";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";

export const TreasuryView: React.FC = () => {
  const { activeCompany, formatCurrency, currencySymbol } = useCompany();
  const [report, setReport] = useState<any>(null);
  const [cashRegisters, setCashRegisters] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [movementsSummary, setMovementsSummary] = useState<any>(null);
  const [totalMovements, setTotalMovements] = useState(0);
  const [loading, setLoading] = useState(true);

  // Tabs: MOVEMENTS (Libro Diario), CASH_REGISTERS (Cajas y Cuadre), BANK_ACCOUNTS (Bancos y Conciliación), TRANSFERS (Traspasos)
  const [activeTab, setActiveTab] = useState<"MOVEMENTS" | "CASH_REGISTERS" | "BANK_ACCOUNTS" | "TRANSFERS">("MOVEMENTS");

  // Filters for Movements
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterSourceType, setFilterSourceType] = useState<string>("ALL");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [movementsPage, setMovementsPage] = useState(1);
  const movementsPageSize = 25;

  // Manual Movement Modal
  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [movType, setMovType] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [movSourceType, setMovSourceType] = useState<"CASH" | "BANK">("CASH");
  const [movSourceId, setMovSourceId] = useState<number>(1);
  const [movAmount, setMovAmount] = useState("");
  const [movPaymentMethod, setMovPaymentMethod] = useState<"CASH" | "CARD" | "TRANSFER" | "SPEI">("CASH");
  const [movReference, setMovReference] = useState("");
  const [movDescription, setMovDescription] = useState("");
  const [movPartner, setMovPartner] = useState("");
  const [movCategory, setMovCategory] = useState<any>("GASTO_OPERATIVO");
  const [creatingMovement, setCreatingMovement] = useState(false);

  // Arqueo y Cuadre de Turno State
  const [selectedRegister, setSelectedRegister] = useState<any>(null);
  const [cuadreData, setCuadreData] = useState<any>(null);
  const [openingCashInput, setOpeningCashInput] = useState("1000");
  const [physicalCashCounted, setPhysicalCashCounted] = useState("");
  const [cashierName, setCashierName] = useState("Mariana Valenzuela Castro");
  const [auditNotes, setAuditNotes] = useState("");
  const [auditResult, setAuditResult] = useState<any>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [denominationCounts, setDenominationCounts] = useState<Record<number, number>>({
    1000: 0,
    500: 0,
    200: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
    5: 0,
    2: 0,
    1: 0,
  });

  // Conciliación Bancaria State
  const [selectedBankAccount, setSelectedBankAccount] = useState<any>(null);
  const [reconciliationData, setReconciliationData] = useState<any>(null);
  const [loadingReconcile, setLoadingReconcile] = useState(false);

  // Internal Transfer State
  const [transferFromType, setTransferFromType] = useState<"CASH" | "BANK">("CASH");
  const [transferFromId, setTransferFromId] = useState<number>(1);
  const [transferToType, setTransferToType] = useState<"CASH" | "BANK">("BANK");
  const [transferToId, setTransferToId] = useState<number>(1);
  const [transferAmount, setTransferAmount] = useState("");
  const [transferRef, setTransferRef] = useState("");
  const [transferNotes, setTransferNotes] = useState("Depósito bancario de corte diario");
  const [transferLoading, setTransferLoading] = useState(false);

  const loadData = async () => {
    if (!activeCompany) return;
    try {
      setLoading(true);
      const [reportRes, cashRes, bankRes, movRes] = await Promise.all([
        treasuryApi.getTreasuryReport(activeCompany.id),
        treasuryApi.listCashRegisters(activeCompany.id),
        treasuryApi.listBankAccounts(activeCompany.id),
        treasuryApi.listMovements({
          companyId: activeCompany.id,
          sourceType: filterSourceType as any,
          type: filterType as any,
          paymentMethod: filterPaymentMethod !== "ALL" ? filterPaymentMethod : undefined,
          q: searchQuery || undefined,
          limit: movementsPageSize,
          offset: (movementsPage - 1) * movementsPageSize,
        }),
      ]);

      setReport(reportRes);
      setCashRegisters(cashRes || []);
      setBankAccounts(bankRes || []);
      setMovements(movRes?.data || []);
      setTotalMovements(movRes?.total || 0);
      setMovementsSummary(movRes?.summary || null);

      if (cashRes?.length > 0 && !selectedRegister) {
        setSelectedRegister(cashRes[0]);
      }
      if (bankRes?.length > 0 && !selectedBankAccount) {
        setSelectedBankAccount(bankRes[0]);
      }
    } catch (err) {
      console.error("Error al cargar tesorería:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeCompany, filterType, filterSourceType, filterPaymentMethod, searchQuery, movementsPage]);

  // Load Cuadre when selected register changes
  useEffect(() => {
    if (selectedRegister?.id) {
      treasuryApi.getCashCuadre(selectedRegister.id).then((data) => {
        setCuadreData(data);
        if (data?.initialCash) setOpeningCashInput(String(data.initialCash));
        if (data?.physicalCashCounted) setPhysicalCashCounted(String(data.physicalCashCounted));
      });
    }
  }, [selectedRegister]);

  // Load Reconciliation when selected bank account changes
  useEffect(() => {
    if (selectedBankAccount?.id) {
      setLoadingReconcile(true);
      treasuryApi
        .getBankReconciliation(selectedBankAccount.id)
        .then((data) => setReconciliationData(data))
        .finally(() => setLoadingReconcile(false));
    }
  }, [selectedBankAccount]);

  // Handle Denomination change and auto-sum
  const handleDenominationChange = (val: number, count: number) => {
    const next = { ...denominationCounts, [val]: Math.max(0, count) };
    setDenominationCounts(next);
    const sum = Object.entries(next).reduce((acc, [denom, qty]) => acc + Number(denom) * qty, 0);
    setPhysicalCashCounted(sum.toFixed(2));
  };

  // Submit Shift Audit / Cuadre
  const handleAuditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRegister) return;
    try {
      setAuditLoading(true);
      const res = await treasuryApi.auditShift(selectedRegister.id, {
        openingCash: parseFloat(openingCashInput) || 1000,
        physicalAmount: parseFloat(physicalCashCounted) || 0,
        shiftName: "Corte y Cuadre de Turno Diario",
        auditorName: cashierName,
        denominations: denominationCounts,
        notes: auditNotes || "Cierre de turno verificado",
      });
      setAuditResult(res);
      alert(`¡Arqueo ejecutado! Estado: ${res.status === "BALANCED" ? "CUADRADO EXACTO" : res.status === "SURPLUS" ? "SOBRANTE" : "FALTANTE"}`);
      loadData();
    } catch (err: any) {
      alert(`Error en arqueo: ${err.message}`);
    } finally {
      setAuditLoading(false);
    }
  };

  // Toggle Movement Reconciliation
  const handleToggleReconcile = async (movementId: string) => {
    try {
      await treasuryApi.toggleReconcile(movementId);
      setMovements((prev) =>
        prev.map((m) => (m.id === movementId ? { ...m, reconciled: !m.reconciled } : m))
      );
      if (selectedBankAccount?.id) {
        treasuryApi.getBankReconciliation(selectedBankAccount.id).then(setReconciliationData);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Submit Manual Movement
  const handleCreateMovementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany || !movAmount || !movDescription) return;

    try {
      setCreatingMovement(true);
      await treasuryApi.createMovement({
        companyId: activeCompany.id,
        type: movType,
        sourceType: movSourceType,
        sourceId: movSourceId,
        amount: parseFloat(movAmount),
        paymentMethod: movPaymentMethod,
        reference: movReference || `MAN-${Date.now().toString().slice(-4)}`,
        description: movDescription,
        partnerName: movPartner || "Operación Manual",
        category: movCategory,
      });
      alert("¡Movimiento de tesorería registrado exitosamente!");
      setMovementModalOpen(false);
      setMovAmount("");
      setMovDescription("");
      setMovPartner("");
      setMovReference("");
      loadData();
    } catch (err: any) {
      alert(`Error al registrar movimiento: ${err.message}`);
    } finally {
      setCreatingMovement(false);
    }
  };

  // Submit Internal Transfer
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany || !transferAmount) return;

    try {
      setTransferLoading(true);
      await treasuryApi.transfer({
        companyId: activeCompany.id,
        fromType: transferFromType,
        fromId: transferFromId,
        toType: transferToType,
        toId: transferToId,
        amount: parseFloat(transferAmount),
        reference: transferRef || `TRAS-${Date.now().toString().slice(-4)}`,
        notes: transferNotes,
      });
      alert(`¡Traspaso de ${formatCurrency(parseFloat(transferAmount))} ejecutado exitosamente!`);
      setTransferAmount("");
      setTransferRef("");
      loadData();
    } catch (err: any) {
      alert(`Error al realizar traspaso: ${err.message}`);
    } finally {
      setTransferLoading(false);
    }
  };

  // Export Movements to CSV
  const handleExportCSV = () => {
    if (movements.length === 0) {
      alert("No hay movimientos para exportar.");
      return;
    }
    const headers = ["Fecha", "Referencia", "Tipo", "Origen/Destino", "Tercero", "Concepto", "Método", "Monto", "Conciliado"];
    const rows = movements.map((m) => [
      m.date ? m.date.slice(0, 10) : "",
      `"${m.reference || ""}"`,
      m.type,
      `"${m.sourceName || ""}"`,
      `"${m.partnerName || ""}"`,
      `"${m.description || ""}"`,
      m.paymentMethod,
      m.amount,
      m.reconciled ? "SI" : "NO",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Reporte_Movimientos_Tesoreria_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPages = Math.max(1, Math.ceil(totalMovements / movementsPageSize));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-heading font-bold text-slate-900 dark:text-white tracking-tight">
              Cajas, Bancos & Reportes de Tesorería
            </h2>
            <Badge variant="primary">Control Financiero</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Libro diario de ingresos y egresos, arqueos de turno, cuadres de caja y conciliación bancaria
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="gap-1.5 text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Exportar CSV</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setMovementModalOpen(true)}
            className="gap-1.5 text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5 text-etiserv-blue" />
            <span>Registrar Movimiento</span>
          </Button>
          <Button
            variant="primary"
            glow
            size="sm"
            onClick={loadData}
            loading={loading}
            className="gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Actualizar</span>
          </Button>
        </div>
      </div>

      {/* TOP TREASURY KPI CARDS (4 CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Liquidez Total */}
        <Card className="p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Liquidez Total Disponible
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-etiserv-blue flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {formatCurrency(report?.totalAvailableLiquidity || 0)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center justify-between">
              <span>Efectivo: <strong className="text-slate-700 dark:text-slate-300 font-mono">{formatCurrency(report?.totalCashBalance || 0)}</strong></span>
              <span>Bancos: <strong className="text-slate-700 dark:text-slate-300 font-mono">{formatCurrency(report?.totalBankBalance || 0)}</strong></span>
            </p>
          </div>
        </Card>

        {/* Card 2: Ingresos del Periodo */}
        <Card className="p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Ingresos del Periodo
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
              +{formatCurrency(report?.totalPeriodIncome || 0)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Cobranza POS, Ventas B2B e Ingresos
            </p>
          </div>
        </Card>

        {/* Card 3: Egresos del Periodo */}
        <Card className="p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Egresos del Periodo
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 tabular-nums">
              -{formatCurrency(report?.totalPeriodExpense || 0)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Proveedores, Nómina y Gastos menores
            </p>
          </div>
        </Card>

        {/* Card 4: Flujo Neto */}
        <Card className="p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Flujo Neto de Caja
            </span>
            <Badge variant={(report?.netCashFlow || 0) >= 0 ? "success" : "danger"} className="font-mono text-[10px]">
              {(report?.netCashFlow || 0) >= 0 ? "+Superávit" : "-Déficit"}
            </Badge>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {formatCurrency(report?.netCashFlow || 0)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Resultado acumulado de tesorería
            </p>
          </div>
        </Card>
      </div>

      {/* NAVIGATION SUB-TABS */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200/80 dark:border-white/10 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("MOVEMENTS")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === "MOVEMENTS"
              ? "bg-white dark:bg-[#071C33] text-etiserv-blue shadow-xs font-bold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Libro Diario de Movimientos</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/10 font-mono">
            {totalMovements}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("CASH_REGISTERS")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === "CASH_REGISTERS"
              ? "bg-white dark:bg-[#071C33] text-etiserv-blue shadow-xs font-bold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Cajas & Arqueo de Turno</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/10 font-mono">
            {cashRegisters.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("BANK_ACCOUNTS")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === "BANK_ACCOUNTS"
              ? "bg-white dark:bg-[#071C33] text-etiserv-blue shadow-xs font-bold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>Cuentas Bancarias & Conciliación</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/10 font-mono">
            {bankAccounts.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("TRANSFERS")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === "TRANSFERS"
              ? "bg-white dark:bg-[#071C33] text-etiserv-blue shadow-xs font-bold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>Traspasos Internos</span>
        </button>
      </div>

      {/* TAB 1: LIBRO DIARIO DE MOVIMIENTOS */}
      {activeTab === "MOVEMENTS" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white dark:bg-[#071C33] p-3 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setMovementsPage(1);
                }}
                placeholder="Buscar por concepto, folio, tercero o cuenta..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#06172A] text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-etiserv-blue font-medium"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Type Filter */}
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setMovementsPage(1);
                }}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#06172A] text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                <option value="ALL">Todos los Tipos</option>
                <option value="INCOME">🟢 Ingresos</option>
                <option value="EXPENSE">🔴 Egresos</option>
                <option value="TRANSFER">🔄 Traspasos</option>
              </select>

              {/* Source Filter */}
              <select
                value={filterSourceType}
                onChange={(e) => {
                  setFilterSourceType(e.target.value);
                  setMovementsPage(1);
                }}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#06172A] text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                <option value="ALL">Todas las Fuentes</option>
                <option value="CASH">💵 Cajas de Efectivo</option>
                <option value="BANK">🏛️ Cuentas Bancarias</option>
              </select>

              {/* Payment Method Filter */}
              <select
                value={filterPaymentMethod}
                onChange={(e) => {
                  setFilterPaymentMethod(e.target.value);
                  setMovementsPage(1);
                }}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#06172A] text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                <option value="ALL">Todos los Métodos</option>
                <option value="CASH">Efectivo</option>
                <option value="CARD">Tarjeta</option>
                <option value="SPEI">SPEI / Transferencia</option>
              </select>
            </div>
          </div>

          {/* Movements Table */}
          <Card className="overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-etiserv-blue" />
                <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Registro de Movimientos de Caja y Bancos
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {totalMovements} Registros
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-etiserv-navyDark text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100 dark:border-white/[0.06]">
                  <tr>
                    <th className="py-2.5 px-4">Fecha / Hora</th>
                    <th className="py-2.5 px-4">Folio / Ref</th>
                    <th className="py-2.5 px-4">Cuenta / Caja</th>
                    <th className="py-2.5 px-4">Tercero / Beneficiario</th>
                    <th className="py-2.5 px-4">Concepto / Descripción</th>
                    <th className="py-2.5 px-4 text-center">Método</th>
                    <th className="py-2.5 px-4 text-right">Monto</th>
                    <th className="py-2.5 px-4 text-center">Conciliado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {movements.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                        No se encontraron movimientos registrados con los filtros seleccionados.
                      </td>
                    </tr>
                  )}
                  {movements.map((mov) => {
                    const isIncome = mov.type === "INCOME";
                    const isTransfer = mov.type === "TRANSFER";

                    return (
                      <tr key={mov.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">
                        {/* Date */}
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {mov.date ? mov.date.slice(0, 16).replace("T", " ") : "Hoy"}
                        </td>

                        {/* Ref / Folio */}
                        <td className="py-3 px-4 font-mono font-bold text-etiserv-blue whitespace-nowrap">
                          {mov.voucherSeq || mov.reference || mov.id}
                        </td>

                        {/* Source */}
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {mov.sourceType === "CASH" ? (
                              <Coins className="w-3.5 h-3.5 text-amber-500" />
                            ) : (
                              <Landmark className="w-3.5 h-3.5 text-blue-500" />
                            )}
                            <span className="font-medium">{mov.sourceName}</span>
                          </div>
                        </td>

                        {/* Partner */}
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                          {mov.partnerName || "Público en General"}
                        </td>

                        {/* Description */}
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate" title={mov.description}>
                          {mov.description}
                        </td>

                        {/* Method */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                            {mov.paymentMethod}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="py-3 px-4 text-right font-mono font-bold text-xs tabular-nums whitespace-nowrap">
                          <span
                            className={
                              isIncome
                                ? "text-emerald-600 dark:text-emerald-400"
                                : isTransfer
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-rose-600 dark:text-rose-400"
                            }
                          >
                            {isIncome ? "+" : isTransfer ? "⇄ " : "-"}
                            {formatCurrency(mov.amount)}
                          </span>
                        </td>

                        {/* Reconciled */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleToggleReconcile(mov.id)}
                            className={`p-1 rounded transition-colors ${
                              mov.reconciled
                                ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                : "text-slate-300 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/10"
                            }`}
                            title={mov.reconciled ? "Movimiento conciliado (Clic para desmarcar)" : "Clic para marcar como conciliado"}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-3 border-t border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.01] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <span className="text-slate-500">
                  Página <strong className="text-slate-900 dark:text-white font-mono">{movementsPage}</strong> de{" "}
                  <strong className="text-slate-900 dark:text-white font-mono">{totalPages}</strong>
                </span>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMovementsPage(1)}
                    disabled={movementsPage <= 1}
                    className="text-xs p-1.5"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMovementsPage((p) => Math.max(1, p - 1))}
                    disabled={movementsPage <= 1}
                    className="text-xs p-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  <span className="px-3 py-1 font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-200/60 dark:bg-white/10 rounded">
                    {movementsPage} / {totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMovementsPage((p) => Math.min(totalPages, p + 1))}
                    disabled={movementsPage >= totalPages}
                    className="text-xs p-1.5"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMovementsPage(totalPages)}
                    disabled={movementsPage >= totalPages}
                    className="text-xs p-1.5"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 2: CAJAS & ARQUEO DE TURNO */}
      {activeTab === "CASH_REGISTERS" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Cash Registers List */}
          <div className="space-y-4">
            <h3 className="font-heading font-semibold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Cajas de Mostrador & Caja Chica
            </h3>

            <div className="space-y-3">
              {cashRegisters.map((cash) => (
                <Card
                  key={cash.id}
                  className={`p-4 cursor-pointer transition-all border-2 ${
                    selectedRegister?.id === cash.id
                      ? "border-etiserv-blue bg-blue-50/20 dark:bg-blue-950/20"
                      : "hover:border-slate-300 dark:hover:border-white/20"
                  }`}
                  onClick={() => setSelectedRegister(cash)}
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="success" dot>Caja Abierta</Badge>
                    <span className="font-mono text-xs font-semibold text-slate-400">{cash.code}</span>
                  </div>

                  <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white mt-2">
                    {cash.name}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">{cash.branchName || "Sucursal Principal"}</p>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
                    <span className="text-xs text-slate-500">Saldo en Efectivo:</span>
                    <strong className="text-base font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(cash.currentBalance || 0)}
                    </strong>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Right 2 Columns: Live Shift Cuadre & Audit Calculator */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center font-bold">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                      Cuadre de Turno & Arqueo: {selectedRegister?.name}
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      Cálculo de balance teórico, conteo físico y registro de diferencias
                    </span>
                  </div>
                </div>
                <Badge variant="primary">Corte Diario</Badge>
              </div>

              {/* Theoretical Breakdown Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block font-bold uppercase">Fondo Inicial (+)</span>
                  <strong className="font-mono text-sm text-slate-900 dark:text-white font-bold">
                    {formatCurrency(cuadreData?.initialCash || 1000)}
                  </strong>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] block font-bold uppercase">Ventas Efectivo (+)</span>
                  <strong className="font-mono text-sm text-emerald-600 font-bold">
                    +{formatCurrency(cuadreData?.totalCashSales || 0)}
                  </strong>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] block font-bold uppercase">Gastos / Depósitos (-)</span>
                  <strong className="font-mono text-sm text-rose-600 font-bold">
                    -{formatCurrency((cuadreData?.totalCashExpenses || 0) + (cuadreData?.totalCashDeposited || 0))}
                  </strong>
                </div>

                <div className="border-l border-slate-200 dark:border-white/10 pl-3">
                  <span className="text-etiserv-blue text-[10px] block font-bold uppercase">Efectivo Esperado</span>
                  <strong className="font-mono text-sm text-etiserv-blue font-bold">
                    {formatCurrency(cuadreData?.expectedCashInDrawer || 0)}
                  </strong>
                </div>
              </div>

              {/* Cash Denomination Breakdown Inputs */}
              <form onSubmit={handleAuditSubmit} className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-amber-500" />
                    <span>Conteo Físico por Denominación</span>
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 rounded-xl bg-slate-50/60 dark:bg-white/[0.01] border border-slate-100 dark:border-white/5">
                    {[1000, 500, 200, 100, 50, 20, 10, 5, 2, 1].map((val) => (
                      <div key={val} className="flex items-center gap-1 bg-white dark:bg-[#071C33] p-1.5 rounded-lg border border-slate-200 dark:border-white/10">
                        <span className="text-[11px] font-mono font-bold text-slate-500 w-12 text-right">
                          ${val}:
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={denominationCounts[val] || 0}
                          onChange={(e) => handleDenominationChange(val, parseInt(e.target.value, 10) || 0)}
                          className="w-full text-right text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-transparent focus:ring-1 focus:ring-etiserv-blue text-slate-900 dark:text-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total Counted vs Theoretical Difference Banner */}
                {(() => {
                  const expected = Number(cuadreData?.expectedCashInDrawer || 0);
                  const counted = parseFloat(physicalCashCounted) || 0;
                  const diff = Number((counted - expected).toFixed(2));

                  return (
                    <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      diff === 0
                        ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/40"
                        : diff > 0
                        ? "bg-blue-50/60 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800/40"
                        : "bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/40"
                    }`}>
                      <div>
                        <span className="text-xs text-slate-600 dark:text-slate-300 block">
                          Total Físico Contado: <strong className="font-mono font-bold text-sm text-slate-900 dark:text-white">{formatCurrency(counted)}</strong>
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {diff === 0
                            ? "✅ El efectivo contado coincide exactamente con el saldo teórico de libros."
                            : diff > 0
                            ? `ℹ️ Sobrante de caja: ${formatCurrency(diff)}`
                            : `⚠️ Faltante de caja: ${formatCurrency(Math.abs(diff))}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant={diff === 0 ? "success" : diff > 0 ? "primary" : "danger"} className="text-xs font-mono font-bold">
                          {diff === 0 ? "CUADRADO EXACTO" : diff > 0 ? `+${formatCurrency(diff)} SOBRANTE` : `-${formatCurrency(Math.abs(diff))} FALTANTE`}
                        </Badge>
                      </div>
                    </div>
                  );
                })()}

                {/* Cashier and Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Cajero / Responsable de Turno:
                    </label>
                    <input
                      type="text"
                      value={cashierName}
                      onChange={(e) => setCashierName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071C33] text-slate-900 dark:text-white font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Observaciones / Notas del Arqueo:
                    </label>
                    <input
                      type="text"
                      value={auditNotes}
                      onChange={(e) => setAuditNotes(e.target.value)}
                      placeholder="ej. Turno matutino cerrado sin incidencias..."
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071C33] text-slate-900 dark:text-white font-medium"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/10">
                  <Button
                    type="submit"
                    variant="primary"
                    glow
                    size="sm"
                    loading={auditLoading}
                    className="gap-1.5 font-semibold"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Firmar y Guardar Arqueo de Turno</span>
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 3: CUENTAS BANCARIAS & CONCILIACIÓN */}
      {activeTab === "BANK_ACCOUNTS" && (
        <div className="space-y-6">
          {/* Bank Accounts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bankAccounts.map((bank) => (
              <Card
                key={bank.id}
                className={`p-5 cursor-pointer transition-all border-2 ${
                  selectedBankAccount?.id === bank.id
                    ? "border-etiserv-blue bg-blue-50/20 dark:bg-blue-950/20"
                    : "hover:border-slate-300 dark:hover:border-white/20"
                }`}
                onClick={() => setSelectedBankAccount(bank)}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="primary">Cuenta Activa</Badge>
                  <Landmark className="w-4 h-4 text-etiserv-blue" />
                </div>
                <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                  {bank.bankName}
                </h4>
                <p className="font-mono text-xs text-slate-400 mt-0.5">
                  CLABE / Cuenta: {bank.accountNumber}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Saldo en Libros:</span>
                    <strong className="font-mono text-slate-900 dark:text-white">
                      {formatCurrency(bank.currentBalance || 0)}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Moneda:</span>
                    <span className="font-mono font-bold">{bank.currencyCode || "MXN"}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Reconciliation Module */}
          {selectedBankAccount && (
            <Card className="p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-etiserv-blue flex items-center justify-center font-bold">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                      Conciliación Bancaria: {selectedBankAccount.bankName}
                    </h3>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Cuenta: {selectedBankAccount.accountNumber}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={reconciliationData?.isReconciled ? "success" : "danger"} className="text-xs font-mono">
                    {reconciliationData?.isReconciled ? "✅ Cuenta Conciliada ($0 Diferencia)" : "⚠️ Diferencia en Tránsito"}
                  </Badge>
                </div>
              </div>

              {/* Reconciliation Breakdown Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10">
                  <span className="text-slate-400 text-[10px] block uppercase font-bold">Saldo según Libros ERP</span>
                  <strong className="font-mono text-sm text-slate-900 dark:text-white font-bold">
                    {formatCurrency(reconciliationData?.erpBookBalance || 0)}
                  </strong>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10">
                  <span className="text-slate-400 text-[10px] block uppercase font-bold">Depósitos en Tránsito (+)</span>
                  <strong className="font-mono text-sm text-emerald-600 font-bold">
                    +{formatCurrency(reconciliationData?.unreconciledDeposits || 0)}
                  </strong>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10">
                  <span className="text-slate-400 text-[10px] block uppercase font-bold">Pagos en Tránsito (-)</span>
                  <strong className="font-mono text-sm text-rose-600 font-bold">
                    -{formatCurrency(reconciliationData?.unreconciledWithdrawals || 0)}
                  </strong>
                </div>

                <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40">
                  <span className="text-etiserv-blue text-[10px] block uppercase font-bold">Saldo Extracto Bancario</span>
                  <strong className="font-mono text-sm text-etiserv-blue font-bold">
                    {formatCurrency(reconciliationData?.bankStatementBalance || 0)}
                  </strong>
                </div>
              </div>

              {/* Pending Transactions Table */}
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-2">
                  Partidas Pendientes de Conciliación ({reconciliationData?.pendingTransactions?.length || 0})
                </h4>

                <div className="border border-slate-200/80 dark:border-white/10 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 dark:bg-etiserv-navyDark text-slate-400 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="py-2 px-3">Fecha</th>
                        <th className="py-2 px-3">Referencia</th>
                        <th className="py-2 px-3">Tercero / Concepto</th>
                        <th className="py-2 px-3 text-right">Monto</th>
                        <th className="py-2 px-3 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                      {reconciliationData?.pendingTransactions?.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                            ¡Todas las partidas de esta cuenta están 100% conciliadas!
                          </td>
                        </tr>
                      )}
                      {reconciliationData?.pendingTransactions?.map((tx: any) => (
                        <tr key={tx.id} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 font-mono">{tx.date ? tx.date.slice(0, 10) : ""}</td>
                          <td className="py-2 px-3 font-mono text-etiserv-blue font-semibold">{tx.reference}</td>
                          <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">{tx.description}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold tabular-nums">
                            {formatCurrency(tx.amount)}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleReconcile(tx.id)}
                              className="text-[11px] py-0.5 px-2"
                            >
                              Conciliar
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* TAB 4: TRASPASOS INTERNOS */}
      {activeTab === "TRANSFERS" && (
        <Card className="p-5 max-w-2xl mx-auto">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-white/10 mb-4">
            <ArrowLeftRight className="w-5 h-5 text-etiserv-blue" />
            <div>
              <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                Traspaso Interno de Fondos (Caja ⇄ Banco)
              </h3>
              <p className="text-xs text-slate-400">
                Depósitos de corte de efectivo a cuenta bancaria o dotación de caja chica
              </p>
            </div>
          </div>

          <form onSubmit={handleTransferSubmit} className="space-y-4 text-xs">
            {/* Origin & Destination Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Origen de los Fondos (Salida):
                </label>
                <div className="space-y-2">
                  <select
                    value={transferFromType}
                    onChange={(e) => setTransferFromType(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071C33]"
                  >
                    <option value="CASH">💵 Caja de Efectivo</option>
                    <option value="BANK">🏛️ Cuenta Bancaria</option>
                  </select>

                  <select
                    value={transferFromId}
                    onChange={(e) => setTransferFromId(parseInt(e.target.value, 10))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071C33]"
                  >
                    {transferFromType === "CASH"
                      ? cashRegisters.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({formatCurrency(c.currentBalance || 0)})
                          </option>
                        ))
                      : bankAccounts.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.bankName} ({formatCurrency(b.currentBalance || 0)})
                          </option>
                        ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Destino de los Fondos (Entrada):
                </label>
                <div className="space-y-2">
                  <select
                    value={transferToType}
                    onChange={(e) => setTransferToType(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071C33]"
                  >
                    <option value="BANK">🏛️ Cuenta Bancaria</option>
                    <option value="CASH">💵 Caja de Efectivo</option>
                  </select>

                  <select
                    value={transferToId}
                    onChange={(e) => setTransferToId(parseInt(e.target.value, 10))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071C33]"
                  >
                    {transferToType === "CASH"
                      ? cashRegisters.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({formatCurrency(c.currentBalance || 0)})
                          </option>
                        ))
                      : bankAccounts.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.bankName} ({formatCurrency(b.currentBalance || 0)})
                          </option>
                        ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Amount and Reference */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Monto a Transferir ({currencySymbol}):
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071C33] text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Folio / Ficha de Depósito:
                </label>
                <input
                  type="text"
                  value={transferRef}
                  onChange={(e) => setTransferRef(e.target.value)}
                  placeholder="ej. FICHA-DEP-8492"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071C33] text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                Motivo / Descripción del Traspaso:
              </label>
              <input
                type="text"
                value={transferNotes}
                onChange={(e) => setTransferNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071C33] text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-white/10">
              <Button
                type="submit"
                variant="primary"
                glow
                size="sm"
                loading={transferLoading}
                className="gap-1.5 font-semibold"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Ejecutar Traspaso de Fondos</span>
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* MODAL: MANUAL MOVEMENT REGISTRATION */}
      <Modal
        isOpen={movementModalOpen}
        onClose={() => setMovementModalOpen(false)}
        title="Registrar Movimiento de Tesorería"
        maxWidth="md"
      >
        <form onSubmit={handleCreateMovementSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                Tipo de Operación:
              </label>
              <select
                value={movType}
                onChange={(e) => setMovType(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071C33]"
              >
                <option value="INCOME">🟢 Ingreso (+)</option>
                <option value="EXPENSE">🔴 Egreso (-)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                Monto ({currencySymbol}):
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={movAmount}
                onChange={(e) => setMovAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-1.5 font-mono font-bold rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071C33]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                Medio / Fuente:
              </label>
              <select
                value={movSourceType}
                onChange={(e) => setMovSourceType(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071C33]"
              >
                <option value="CASH">💵 Caja de Efectivo</option>
                <option value="BANK">🏛️ Cuenta Bancaria</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                Cuenta / Caja Específica:
              </label>
              <select
                value={movSourceId}
                onChange={(e) => setMovSourceId(parseInt(e.target.value, 10))}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071C33]"
              >
                {movSourceType === "CASH"
                  ? cashRegisters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)
                  : bankAccounts.map((b) => <option key={b.id} value={b.id}>{b.bankName}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                Método de Pago:
              </label>
              <select
                value={movPaymentMethod}
                onChange={(e) => setMovPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071C33]"
              >
                <option value="CASH">Efectivo</option>
                <option value="CARD">Tarjeta de Débito/Crédito</option>
                <option value="TRANSFER">Transferencia Bancaria / ACH</option>
                <option value="CHECK">Cheque</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                Categoría:
              </label>
              <select
                value={movCategory}
                onChange={(e) => setMovCategory(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071C33]"
              >
                <option value="GASTO_OPERATIVO">Gasto Operativo / Servicios</option>
                <option value="PAGO_PROVEEDOR">Pago a Proveedor</option>
                <option value="NOMINA">Pago de Nómina</option>
                <option value="VENTA_POS">Cobro de Venta</option>
                <option value="FONDO_INICIAL">Fondo / Dotación</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
              Tercero / Cliente / Proveedor:
            </label>
            <input
              type="text"
              value={movPartner}
              onChange={(e) => setMovPartner(e.target.value)}
              placeholder="ej. Papelería Central, CFE, Cliente..."
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071C33]"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
              Concepto / Descripción del Movimiento:
            </label>
            <input
              type="text"
              value={movDescription}
              onChange={(e) => setMovDescription(e.target.value)}
              placeholder="ej. Compra de insumos de papelería para caja mostrador"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071C33]"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/10">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMovementModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              glow
              size="sm"
              loading={creatingMovement}
              className="gap-1.5 font-semibold"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Guardar Movimiento</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TreasuryView;
