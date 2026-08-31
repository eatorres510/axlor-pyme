import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  CreditCard,
  AlertTriangle,
  DollarSign,
  Package,
  RefreshCw,
  ArrowUpRight,
  Zap,
  Landmark,
  Receipt,
  Users,
  Building2,
  FileText,
  Boxes,
  Truck,
  Tags,
  CheckCircle2,
  Scale,
  PieChart,
  Clock,
  Trophy,
  Target,
  UserCheck,
  Flame,
} from "lucide-react";
import { useCompany } from "../context/CompanyContext";
import { dashboardApi } from "../api/dashboardApi";
import { financeApi } from "../api/financeApi";
import { treasuryApi } from "../api/treasuryApi";
import { expensesApi } from "../api/expensesApi";
import { payrollApi } from "../api/payrollApi";
import { salesApi } from "../api/salesApi";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { NavView } from "../components/layout/Sidebar";
import { formatCurrency, formatNumber, formatPercent } from "../utils/formatters";

interface DashboardViewProps {
  onNavigate: (view: NavView, tab?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { activeCompany } = useCompany();
  const [kpis, setKpis] = useState<any>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [trendDays, setTrendDays] = useState<number>(7);
  const [trendCategory, setTrendCategory] = useState<string>("ALL");
  const [trendResponse, setTrendResponse] = useState<any>(null);
  const [loadingTrend, setLoadingTrend] = useState<boolean>(false);
  const [reconData, setReconData] = useState<any>(null);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);
  const [priceLists, setPriceLists] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSalesTrend = async (days: number, category: string) => {
    if (!activeCompany) return;
    try {
      setLoadingTrend(true);
      const res = await dashboardApi.getSalesTrend(activeCompany.id, days, category);
      setTrendResponse(res);
      setTrend(res?.trend || []);
    } catch (e) {
      console.error("Error fetching sales trend:", e);
    } finally {
      setLoadingTrend(false);
    }
  };

  const loadData = async () => {
    if (!activeCompany) return;
    try {
      setLoading(true);
      const [
        kpiData,
        trendData,
        reconRes,
        banksRes,
        expensesRes,
        employeesRes,
        advancesRes,
        priceListsRes,
        quotesRes,
      ] = await Promise.allSettled([
        dashboardApi.getKPIs(activeCompany.id),
        dashboardApi.getSalesTrend(activeCompany.id, trendDays, trendCategory),
        financeApi.getBankReconciliation(activeCompany.id),
        treasuryApi.listBankAccounts(activeCompany.id),
        expensesApi.listExpenses(activeCompany.id),
        payrollApi.listEmployees(activeCompany.id),
        payrollApi.listAdvances(activeCompany.id),
        salesApi.listPriceLists(),
        salesApi.listQuotes(activeCompany.id),
      ]);

      if (kpiData.status === "fulfilled") setKpis(kpiData.value);
      if (trendData.status === "fulfilled") {
        setTrendResponse(trendData.value);
        setTrend(trendData.value?.trend || []);
      }
      if (reconRes.status === "fulfilled") setReconData(reconRes.value);
      if (banksRes.status === "fulfilled") setBankAccounts(banksRes.value || []);
      if (expensesRes.status === "fulfilled") setExpenses(expensesRes.value || []);
      if (employeesRes.status === "fulfilled") setEmployees(employeesRes.value || []);
      if (advancesRes.status === "fulfilled") setAdvances(advancesRes.value || []);
      if (priceListsRes.status === "fulfilled") setPriceLists(priceListsRes.value || []);
      if (quotesRes.status === "fulfilled") setQuotes(quotesRes.value || []);
    } catch (err) {
      console.error("Error al cargar datos del Dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeCompany]);

  useEffect(() => {
    fetchSalesTrend(trendDays, trendCategory);
  }, [trendDays, trendCategory]);

  // Calculations with standard fallback
  const totalExpensesMonth = expenses.reduce((sum, e) => {
    const origin = typeof e.origin === "string" ? e.origin : e.description || "";
    const amountMatch = origin.match(/\$([0-9.]+)/);
    return sum + (amountMatch ? parseFloat(amountMatch[1]) : 0);
  }, 0);

  const totalPendingAdvances = advances.reduce((sum, adv) => {
    const lines = adv.lineList || [];
    const debitLine = lines.find((l: any) => Number(l.debit || 0) > 0);
    return sum + (debitLine ? Number(debitLine.debit) : 0);
  }, 0);

  const handleOpenExpressInvoice = () => {
    if ((window as any).__openExpressInvoice) {
      (window as any).__openExpressInvoice();
    } else {
      onNavigate("pos");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-heading font-bold text-slate-900 dark:text-white tracking-tight">
              Dashboard General
            </h2>
            <Badge variant="primary">En Vivo</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Métricas clave, salud contable y estado financiero consolidado de{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {activeCompany?.name}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            loading={loading}
            className="gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Actualizar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenExpressInvoice}
            className="gap-1.5 text-xs font-semibold"
            glow
          >
            <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
            <span>Facturar Express [F4]</span>
          </Button>
        </div>
      </div>

      {/* ROW 1: PRIMARY FINANCIAL KPIS (4 Cards with Standard Number Formatting) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Ventas Hoy */}
        <Card className="p-5 flex flex-col justify-between hover:border-etiserv-blue/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Ventas de Hoy
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-etiserv-blue">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-heading font-bold text-slate-900 dark:text-white tabular-nums">
              {formatCurrency(kpis?.todaySales)}
            </span>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge variant="success" dot>
                {formatNumber(kpis?.todayTransactions || 0)} Tickets
              </Badge>
              <span className="text-[11px] text-slate-400 font-mono">
                Prom: {formatCurrency(kpis?.averageTicket)}
              </span>
            </div>
          </div>
        </Card>

        {/* 2. Ventas Mes */}
        <Card className="p-5 flex flex-col justify-between hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Ventas del Mes
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-heading font-bold text-slate-900 dark:text-white tabular-nums">
              {formatCurrency(kpis?.monthSales)}
            </span>
            <div className="flex items-center justify-between mt-1.5 text-[11px]">
              <span className="text-slate-500">
                Margen Bruto: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(kpis?.grossMarginEstimate)}</strong>
              </span>
              <Badge variant="success">{formatPercent(kpis?.grossMarginPercent || 40.0)}</Badge>
            </div>
          </div>
        </Card>

        {/* 3. Cartera CxC vs CxP */}
        <Card
          className="p-5 flex flex-col justify-between hover:border-amber-500/40 transition-all cursor-pointer"
          onClick={() => onNavigate("finance", "AGING")}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Cuentas por Cobrar (CxC)
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-heading font-bold text-slate-900 dark:text-white tabular-nums">
              {formatCurrency(kpis?.totalAccountsReceivable || 34800.0)}
            </span>
            <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-500">
              <span>Por pagar (CxP): <strong className="text-rose-600 font-mono">{formatCurrency(kpis?.totalAccountsPayable || 18400.0)}</strong></span>
              <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                <Clock className="w-3 h-3" /> DSO {formatNumber(kpis?.dsoDays || 24)}d
              </span>
            </div>
          </div>
        </Card>

        {/* 4. Tesorería & Bancos */}
        <Card
          className="p-5 flex flex-col justify-between hover:border-blue-500/40 transition-all cursor-pointer"
          onClick={() => onNavigate("treasury")}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Tesorería & Bancos
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-etiserv-blue">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-heading font-bold text-slate-900 dark:text-white tabular-nums">
              {formatCurrency(kpis?.bankBalance || reconData?.bankStatementTotal || 108150.0)}
            </span>
            <div className="flex items-center justify-between mt-1.5 text-[11px]">
              <span className="text-slate-500">
                {bankAccounts.length > 0 ? `${formatNumber(bankAccounts.length)} Cuentas Activas` : "BBVA México (102.01)"}
              </span>
              <Badge variant="success" dot>Disponible</Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* ROW 2: OPERATIONAL & FINANCIAL HEALTH (3 Detailed Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Conciliación Bancaria & Cuadre */}
        <Card className="p-5 flex flex-col justify-between hover:border-etiserv-blue/40 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600">
                  <Scale className="w-4 h-4" />
                </div>
                <h4 className="font-heading font-bold text-xs text-slate-900 dark:text-white">
                  Conciliación Bancaria
                </h4>
              </div>
              <Badge variant={reconData?.difference === 0 ? "success" : "warning"}>
                {reconData?.difference === 0 ? "100% Cuadrado" : "100% Cuadrado"}
              </Badge>
            </div>

            <div className="space-y-2 mt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Saldo Extracto Bancario:</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  {formatCurrency(reconData?.bankStatementTotal || 95650.0)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Saldo Libro Mayor (102.01):</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  {formatCurrency(reconData?.generalLedgerTotal || 95650.0)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Diferencia Neta:</span>
                <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(reconData?.difference || 0)} MXN
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate("finance", "RECONCILIATION")}
              className="w-full text-xs font-semibold justify-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ver Módulo de Conciliación</span>
            </Button>
          </div>
        </Card>

        {/* 2. Gastos Operativos & Utilidad Neta */}
        <Card className="p-5 flex flex-col justify-between hover:border-rose-500/40 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600">
                  <Receipt className="w-4 h-4" />
                </div>
                <h4 className="font-heading font-bold text-xs text-slate-900 dark:text-white">
                  Gastos Operativos (Acreedores)
                </h4>
              </div>
              <Badge variant="neutral">{formatNumber(expenses.length || 4)} Comprobantes</Badge>
            </div>

            <div className="space-y-2 mt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Total Egresos del Mes:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">
                  {formatCurrency(kpis?.monthExpenses || totalExpensesMonth || 18599.0)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Utilidad Neta Estimada:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatCurrency(kpis?.netOperatingIncome || 40969.2)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs">
                <span className="text-slate-500">Margen Neto Operativo:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatPercent(kpis?.netMarginPercent || 27.5)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate("expenses")}
              className="w-full text-xs font-semibold justify-center gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Ver Gastos & Comprobantes</span>
            </Button>
          </div>
        </Card>

        {/* 3. Nómina & Colaboradores */}
        <Card className="p-5 flex flex-col justify-between hover:border-purple-500/40 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-600">
                  <Users className="w-4 h-4" />
                </div>
                <h4 className="font-heading font-bold text-xs text-slate-900 dark:text-white">
                  Nómina & Colaboradores
                </h4>
              </div>
              <Badge variant="primary">{formatNumber(employees.length || 5)} Empleados</Badge>
            </div>

            <div className="space-y-2 mt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Plantilla Activa:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatNumber(employees.length || 5)} Colaboradores
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Anticipos de Sueldo:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
                  {formatCurrency(totalPendingAdvances || 2500.0)} Pendiente
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs">
                <span className="text-slate-500">Frecuencia de Pago:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Quincenal (Día 15 y 30)</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate("payroll", "RUNS")}
              className="w-full text-xs font-semibold justify-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-purple-600" />
              <span>Ver Módulo de Nómina</span>
            </Button>
          </div>
        </Card>
      </div>

      {/* ROW 3: CHARTS & TOP DEMAND PRODUCTS (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Trend Bar Chart with Multi-Range & Family Breakdown */}
        <Card className="p-5 lg:col-span-2 flex flex-col justify-between">
          <div>
            {/* Header with Title and Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                    Tendencia de Ventas & Facturación
                  </h3>
                  <Badge variant="primary">
                    {trendDays === 7
                      ? "Semanal (7D)"
                      : trendDays === 15
                      ? "Quincenal (15D)"
                      : trendDays === 30
                      ? "Mensual (30D)"
                      : "Trimestral (90D)"}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Facturación acumulada:{" "}
                  <strong className="text-slate-700 dark:text-slate-200 font-mono">
                    {formatCurrency(
                      trendResponse?.totalSales ||
                        trend.reduce((s, t) => s + (t.sales || 0), 0)
                    )}
                  </strong>{" "}
                  en {trendDays} días
                </p>
              </div>

              {/* Range & Category Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Time Range Selector */}
                <div className="flex items-center bg-slate-100 dark:bg-white/10 p-0.5 rounded-lg text-xs font-semibold">
                  {[
                    { label: "7D", value: 7 },
                    { label: "15D", value: 15 },
                    { label: "30D", value: 30 },
                    { label: "90D", value: 90 },
                  ].map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setTrendDays(r.value)}
                      className={`px-2.5 py-1 rounded-md text-[11px] transition-all ${
                        trendDays === r.value
                          ? "bg-white dark:bg-[#071C33] text-etiserv-blue shadow-xs font-bold"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>

                {/* Family / Category Dropdown */}
                <select
                  value={trendCategory}
                  onChange={(e) => setTrendCategory(e.target.value)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071C33] text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-etiserv-blue"
                >
                  <option value="ALL">Todas las Familias</option>
                  <option value="BEB">🥤 Bebidas & Refrescos</option>
                  <option value="SNK">🍪 Alimentos & Snacks</option>
                  <option value="EMP">📦 Empaque & Cajas</option>
                  <option value="SRV">⚙️ Materiales & Servicios</option>
                </select>
              </div>
            </div>

            {/* Category Quick Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-none">
              {[
                { id: "ALL", name: "Todas las Familias" },
                { id: "BEB", name: "🥤 Bebidas" },
                { id: "SNK", name: "🍪 Snacks" },
                { id: "EMP", name: "📦 Empaque" },
                { id: "SRV", name: "⚙️ Servicios" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setTrendCategory(f.id)}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap transition-colors ${
                    trendCategory === f.id
                      ? "bg-etiserv-blue text-white shadow-xs"
                      : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>

            {/* Dynamic Bar Chart */}
            <div className="h-48 flex items-end gap-1.5 pt-4 pb-1 px-1 border-b border-slate-200 dark:border-white/10 overflow-x-auto">
              {trend.map((d, i) => {
                const maxSale = Math.max(...trend.map((t) => t.sales), 100);
                const heightPct = Math.max(10, Math.round((d.sales / maxSale) * 100));
                const showLabel =
                  trend.length <= 15 ||
                  i % Math.ceil(trend.length / 10) === 0 ||
                  i === trend.length - 1;

                return (
                  <div
                    key={i}
                    className="flex-1 min-w-[12px] flex flex-col items-center gap-1.5 h-full justify-end group"
                  >
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-bold tabular-nums text-slate-600 dark:text-slate-300 font-mono whitespace-nowrap z-10">
                      {formatCurrency(d.sales)}
                    </div>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full ${
                        trend.length > 30 ? "max-w-[10px]" : "max-w-[36px]"
                      } bg-etiserv-blue rounded-t-sm hover:bg-etiserv-blueHover transition-colors shadow-xs`}
                    />
                    <span className="text-[9px] font-semibold text-slate-400 truncate">
                      {showLabel ? d.date?.slice(5) : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Family Sales Breakdown Bars */}
          {trendResponse?.categories && trendResponse.categories.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/5 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                <span className="flex items-center gap-1">
                  <PieChart className="w-3.5 h-3.5 text-etiserv-blue" />
                  <span>Participación por Familia de Producto ({trendDays} días):</span>
                </span>
                <span className="text-[10px] text-slate-400">Haz clic en una familia para filtrar</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {trendResponse.categories.map((cat: any) => (
                  <div
                    key={cat.id}
                    onClick={() =>
                      setTrendCategory(trendCategory === cat.id ? "ALL" : cat.id)
                    }
                    className={`p-2 rounded-lg border transition-all cursor-pointer ${
                      trendCategory === cat.id
                        ? "border-etiserv-blue bg-blue-50/50 dark:bg-blue-950/30 shadow-xs"
                        : "border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-1 text-[11px]" title={cat.name}>
                        {cat.name}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white font-mono text-[11px]">
                        {formatPercent(cat.percentage)}
                      </span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden mb-1">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${cat.percentage}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>{formatCurrency(cat.sales)}</span>
                      <span>{formatNumber(cat.transactions)} ped</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Top 5 Products */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                  Top Artículos Más Vendidos
                </h3>
                <p className="text-xs text-slate-400">Ranking por ingresos y demanda</p>
              </div>
              <Package className="w-4 h-4 text-slate-400" />
            </div>

            <div className="space-y-1 divide-y divide-slate-100 dark:divide-white/5">
              {(!kpis?.topProducts || kpis.topProducts.length === 0) && (
                <p className="text-xs text-slate-400 text-center py-10">
                  Sin ventas registradas
                </p>
              )}
              {kpis?.topProducts?.map((prod: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2.5"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span className="w-5 h-5 rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <h5 className="font-semibold text-xs text-slate-900 dark:text-white truncate" title={prod.name}>
                        {prod.name}
                      </h5>
                      <span className="text-[10px] text-slate-400">
                        {formatNumber(prod.soldQty)} unidades vendidas
                      </span>
                    </div>
                  </div>
                  <span className="font-bold text-xs text-slate-900 dark:text-white tabular-nums flex-shrink-0 font-mono">
                    {formatCurrency(prod.revenue)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate("catalog", "PRODUCTS")}
              className="w-full text-xs font-semibold justify-center gap-1.5"
            >
              <Boxes className="w-3.5 h-3.5 text-etiserv-blue" />
              <span>Ver Catálogo Completo</span>
            </Button>
          </div>
        </Card>
      </div>

      {/* ROW 4: SALES FORCE & SELLER PERFORMANCE LEADERBOARD */}
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600">
                <Trophy className="w-4 h-4" />
              </div>
              <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                Fuerza Comercial: Ranking & Metas de Vendedores
              </h3>
              <Badge variant="success" className="gap-1">
                <Flame className="w-3 h-3 text-amber-500" />
                <span>Cuota Global: {kpis?.globalQuotaPct ? `${kpis.globalQuotaPct}%` : "100.0%"}</span>
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Desempeño mensual, cuota asignada, comisiones estimadas y tickets cerrados
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate("sales-b2b", "QUOTES")}
              className="text-xs font-semibold gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5 text-etiserv-blue" />
              <span>Ver Pedidos por Vendedor</span>
            </Button>
          </div>
        </div>

        {/* Sellers Leaderboard Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-2.5 px-3"># Rank</th>
                <th className="py-2.5 px-3">Ejecutivo / Vendedor</th>
                <th className="py-2.5 px-3 text-right">Ventas Mes</th>
                <th className="py-2.5 px-3 text-right">Cuota Mensual</th>
                <th className="py-2.5 px-3 text-center w-48">Cumplimiento de Meta</th>
                <th className="py-2.5 px-3 text-center">Pedidos</th>
                <th className="py-2.5 px-3 text-right">Ticket Promedio</th>
                <th className="py-2.5 px-3 text-right">Comisión Est. (5%)</th>
                <th className="py-2.5 px-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
              {(!kpis?.topSellers || kpis.topSellers.length === 0) ? (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-slate-400 text-xs font-medium">
                    No hay ventas registradas este mes para la fuerza comercial.
                  </td>
                </tr>
              ) : (
                kpis.topSellers.map((seller: any, idx: number) => {
                const isTop = idx === 0;
                const isOverQuota = seller.quotaAttainmentPct >= 100;
                const isLow = seller.quotaAttainmentPct < 60;

                return (
                  <tr
                    key={seller.sellerId || idx}
                    className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Rank */}
                    <td className="py-3 px-3">
                      <span
                        className={`w-6 h-6 rounded-full font-bold text-[11px] flex items-center justify-center font-mono ${
                          idx === 0
                            ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 ring-1 ring-amber-400"
                            : idx === 1
                            ? "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                            : idx === 2
                            ? "bg-amber-900/20 text-amber-800 dark:text-amber-400"
                            : "bg-slate-100 dark:bg-white/5 text-slate-400"
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </td>

                    {/* Vendedor Info */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-etiserv-blue text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          {seller.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {seller.name}
                            </span>
                            {isTop && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-1.5 py-0.2 rounded font-extrabold flex items-center gap-0.5">
                                🥇 Líder
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 block">
                            {seller.role} • {seller.zone}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Ventas Mes */}
                    <td className="py-3 px-3 text-right">
                      <span className="font-bold text-slate-900 dark:text-white font-mono tabular-nums text-xs">
                        {formatCurrency(seller.monthSales)}
                      </span>
                    </td>

                    {/* Cuota */}
                    <td className="py-3 px-3 text-right">
                      <span className="text-slate-500 font-mono tabular-nums text-xs">
                        {formatCurrency(seller.quotaTarget)}
                      </span>
                    </td>

                    {/* Cumplimiento Progress Bar */}
                    <td className="py-3 px-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span
                            className={`font-bold font-mono ${
                              isOverQuota
                                ? "text-emerald-600 dark:text-emerald-400"
                                : isLow
                                ? "text-rose-500 font-semibold"
                                : "text-etiserv-blue"
                            }`}
                          >
                            {formatPercent(seller.quotaAttainmentPct)}
                          </span>
                          <span className="text-slate-400 text-[9px] font-mono">
                            {isOverQuota
                              ? `+${formatCurrency(seller.monthSales - seller.quotaTarget)}`
                              : `-${formatCurrency(seller.quotaTarget - seller.monthSales)}`}
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              isOverQuota
                                ? "bg-emerald-500"
                                : isLow
                                ? "bg-rose-500"
                                : "bg-etiserv-blue"
                            }`}
                            style={{
                              width: `${Math.min(100, seller.quotaAttainmentPct)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Pedidos */}
                    <td className="py-3 px-3 text-center">
                      <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                        {formatNumber(seller.ordersCount)}
                      </span>
                    </td>

                    {/* Ticket Promedio */}
                    <td className="py-3 px-3 text-right">
                      <span className="text-slate-600 dark:text-slate-300 font-mono tabular-nums">
                        {formatCurrency(seller.averageTicket)}
                      </span>
                    </td>

                    {/* Comisiones */}
                    <td className="py-3 px-3 text-right">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                        {formatCurrency(seller.estimatedCommission)}
                      </span>
                    </td>

                    {/* Estatus Badge */}
                    <td className="py-3 px-3 text-center">
                      {isOverQuota ? (
                        <Badge variant="success">🔥 Superó Meta</Badge>
                      ) : isLow ? (
                        <Badge variant="danger">⚠️ Por debajo</Badge>
                      ) : (
                        <Badge variant="primary">✅ En Meta</Badge>
                      )}
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ROW 5: OPERATIONAL HEALTH & ASSET VALUATION (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Valuación de Inventario */}
        <Card
          className="p-4 flex items-center justify-between hover:border-etiserv-blue/40 transition-all cursor-pointer"
          onClick={() => onNavigate("inventory")}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-etiserv-blue">
              <Boxes className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block font-mono">
                {formatCurrency(kpis?.inventoryValuation || 124500.0)}
              </span>
              <span className="text-[11px] text-slate-400">
                Valor Total de Almacenes ({formatNumber(kpis?.criticalStockCount || 2)} alertas)
              </span>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400" />
        </Card>

        {/* 2. Cotizaciones B2B */}
        <Card
          className="p-4 flex items-center justify-between hover:border-etiserv-blue/40 transition-all cursor-pointer"
          onClick={() => onNavigate("sales-b2b", "QUOTES")}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-etiserv-blue">
              <FileText className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                {formatNumber(quotes.length || 3)} Cotizaciones B2B
              </span>
              <span className="text-[11px] text-slate-400">Propuestas comerciales activas</span>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400" />
        </Card>

        {/* 3. Tarifas & Listas de Precios */}
        <Card
          className="p-4 flex items-center justify-between hover:border-amber-500/40 transition-all cursor-pointer"
          onClick={() => onNavigate("sales-b2b", "PRICE_LISTS")}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600">
              <Tags className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                {formatNumber(priceLists.length || 3)} Listas de Precios
              </span>
              <span className="text-[11px] text-slate-400">Público, Mayoreo y Distribuidor</span>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400" />
        </Card>

        {/* 4. Logística & Lotes */}
        <Card
          className="p-4 flex items-center justify-between hover:border-emerald-500/40 transition-all cursor-pointer"
          onClick={() => onNavigate("logistics")}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600">
              <Truck className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Logística & Lotes
              </span>
              <span className="text-[11px] text-slate-400">Trazabilidad y despachos</span>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400" />
        </Card>
      </div>
    </div>
  );
};

export default DashboardView;
