import React, { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Coins,
  Receipt,
  FileSpreadsheet,
  Send,
  Search,
  CheckCircle2,
  Calendar,
  CreditCard,
  Building2,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  Printer,
  Eye,
  FileText,
} from "lucide-react";
import { useCompany } from "../context/CompanyContext";
import { payrollApi } from "../api/payrollApi";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Autocomplete, AutocompleteItem } from "../components/ui/Autocomplete";
import { PayrollReceiptModal, PayrollReceiptData } from "../components/layout/PayrollReceiptModal";
import { AdvanceVoucherModal, AdvanceVoucherData } from "../components/layout/AdvanceVoucherModal";
import { clsx } from "clsx";

export type PayrollTab = "EMPLOYEES" | "ADVANCES" | "RUNS";

interface PayrollViewProps {
  initialTab?: PayrollTab;
}

export const PayrollView: React.FC<PayrollViewProps> = ({ initialTab }) => {
  const { activeCompany } = useCompany();
  const [activeTab, setActiveTab] = useState<PayrollTab>(initialTab || "EMPLOYEES");

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [employees, setEmployees] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // New Employee Modal
  const [empModalOpen, setEmpModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [baseSalary, setBaseSalary] = useState("");
  const [paymentPeriod, setPaymentPeriod] = useState<"WEEKLY" | "BIWEEKLY" | "MONTHLY">("BIWEEKLY");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [createEmpLoading, setCreateEmpLoading] = useState(false);

  // Advance Modal
  const [advModalOpen, setAdvModalOpen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState<number>(0);
  const [advAmount, setAdvAmount] = useState("");
  const [advPaymentMethod, setAdvPaymentMethod] = useState<"CASH" | "BANK">("CASH");
  const [advNotes, setAdvNotes] = useState("");
  const [advLoading, setAdvLoading] = useState(false);

  // Run Payroll Modal
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [period, setPeriod] = useState("2026-08-Q2");
  const [runPaymentMethod, setRunPaymentMethod] = useState<"CASH" | "BANK">("BANK");
  const [runLoading, setRunLoading] = useState(false);

  // Document Modals State
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<PayrollReceiptData | null>(null);

  const [advVoucherModalOpen, setAdvVoucherModalOpen] = useState(false);
  const [advVoucherData, setAdvVoucherData] = useState<AdvanceVoucherData | null>(null);

  const [runDetailsModalOpen, setRunDetailsModalOpen] = useState(false);
  const [selectedRun, setSelectedRun] = useState<any>(null);

  const loadPayroll = async () => {
    if (!activeCompany) return;
    try {
      setLoading(true);
      const [empData, runsData, advData] = await Promise.all([
        payrollApi.listEmployees(activeCompany.id),
        payrollApi.listRuns(activeCompany.id),
        payrollApi.listAdvances(activeCompany.id),
      ]);
      setEmployees(empData || []);
      setRuns(runsData || []);
      setAdvances(advData || []);
      if (empData?.length > 0 && !selectedEmpId) {
        setSelectedEmpId(empData[0].id);
      }
    } catch (err) {
      console.error("Error al cargar nómina:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayroll();
  }, [activeCompany]);

  // Helper para abrir recibo de nómina individual
  const handleOpenReceiptForEmployee = (emp: any, runPeriod = period) => {
    if (!activeCompany) return;
    const base = Number(emp.baseSalary || 7500);

    // Calcular anticipos acumulados del empleado
    const empAdvances = advances.filter((a) => {
      const orig = typeof a.origin === "string" ? a.origin : a.origin?.name || "";
      return orig.includes(`[${emp.name}]`);
    });
    const totalAdvDeducted = empAdvances.reduce((sum, a) => {
      const debitLine = (a.lineList || []).find((l: any) => Number(l.debit || 0) > 0);
      return sum + (debitLine ? Number(debitLine.debit) : 0);
    }, 0);

    const bonus = 0;
    const overtime = 0;
    const gross = base + bonus + overtime;
    const isr = Number((gross * 0.08).toFixed(2));
    const imss = Number((gross * 0.025).toFixed(2));
    const totalDeductions = Number((isr + imss + totalAdvDeducted).toFixed(2));
    const netPay = Number((gross - totalDeductions).toFixed(2));

    const receipt: PayrollReceiptData = {
      receiptNumber: `REC-${String(emp.id || 1).padStart(4, "0")}-${runPeriod.replace(/[^a-zA-Z0-9]/g, "")}`,
      companyName: activeCompany.name || "Distribuidora Nacional PyME S.A.",
      companyTaxId: activeCompany.taxId || "DNP190820KX1",
      period: runPeriod,
      date: new Date().toLocaleDateString("es-MX"),
      employeeName: emp.name,
      employeeTaxId: emp.taxId || "XAXX010101000",
      employeeCode: emp.code || `EMP-${emp.id}`,
      jobTitle: emp.jobTitle || "Colaborador General",
      paymentPeriod:
        emp.paymentPeriod === "WEEKLY"
          ? "Semanal"
          : emp.paymentPeriod === "MONTHLY"
          ? "Mensual"
          : "Quincenal",
      paymentMethod: "Transferencia / Depósito SPEI",
      baseSalary: base,
      bonus,
      overtime,
      totalGross: gross,
      taxDeduction: isr,
      imssDeduction: imss,
      advanceDeduction: totalAdvDeducted,
      otherDeductions: 0,
      totalDeductions,
      netPay,
    };

    setReceiptData(receipt);
    setReceiptModalOpen(true);
  };

  // Helper para abrir vale de anticipo
  const handleOpenAdvanceVoucher = (adv: any) => {
    if (!activeCompany) return;
    const lines = adv.lineList || [];
    const debitLine = lines.find((l: any) => Number(l.debit || 0) > 0);
    const amount = debitLine ? Number(debitLine.debit) : 0;
    const orig = typeof adv.origin === "string" ? adv.origin : adv.origin?.name || "Anticipo de Sueldo";

    const match = orig.match(/\[(.*?)\]/);
    const empName = match ? match[1] : orig;
    const empObj = employees.find((e) => e.name === empName);

    const voucher: AdvanceVoucherData = {
      voucherNumber: `ADV-${String(adv.id || 1).padStart(5, "0")}`,
      companyName: activeCompany.name || "Distribuidora Nacional PyME S.A.",
      companyTaxId: activeCompany.taxId || "DNP190820KX1",
      date: adv.date || adv.createdOn?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      employeeName: empName,
      employeeTaxId: empObj?.taxId || "XAXX010101000",
      employeeCode: empObj?.code || `EMP-${empObj?.id || 1}`,
      jobTitle: empObj?.jobTitle || "Colaborador General",
      amount: amount,
      paymentMethod: "CASH",
      notes: orig,
    };

    setAdvVoucherData(voucher);
    setAdvVoucherModalOpen(true);
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany || !name || !taxId || !baseSalary) return;
    try {
      setCreateEmpLoading(true);
      await payrollApi.createEmployee({
        companyId: activeCompany.id,
        name,
        taxId,
        jobTitle: jobTitle || "Colaborador General",
        baseSalary: parseFloat(baseSalary),
        paymentPeriod,
        phone,
        email,
      });
      setEmpModalOpen(false);
      setName("");
      setTaxId("");
      setJobTitle("");
      setBaseSalary("");
      setPhone("");
      setEmail("");
      loadPayroll();
    } catch (err: any) {
      alert(`Error al dar de alta empleado: ${err.message}`);
    } finally {
      setCreateEmpLoading(false);
    }
  };

  const handleCreateAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany || !selectedEmpId || !advAmount) return;
    try {
      setAdvLoading(true);
      const res = await payrollApi.createAdvance({
        companyId: activeCompany.id,
        employeeId: selectedEmpId,
        amount: parseFloat(advAmount),
        paymentMethod: advPaymentMethod,
        notes: advNotes || "Anticipo de sueldo",
      });

      const empObj = employees.find((e) => e.id === selectedEmpId);
      const moveId = res?.moveId || Math.floor(Math.random() * 9000 + 1000);

      const voucher: AdvanceVoucherData = {
        voucherNumber: `ADV-${String(moveId).padStart(5, "0")}`,
        companyName: activeCompany.name || "Distribuidora Nacional PyME S.A.",
        companyTaxId: activeCompany.taxId || "DNP190820KX1",
        date: new Date().toLocaleDateString("es-MX"),
        employeeName: empObj?.name || `Empleado #${selectedEmpId}`,
        employeeTaxId: empObj?.taxId || "XAXX010101000",
        employeeCode: empObj?.code || `EMP-${selectedEmpId}`,
        jobTitle: empObj?.jobTitle || "Colaborador General",
        amount: parseFloat(advAmount),
        paymentMethod: advPaymentMethod,
        notes: advNotes || "Anticipo de nómina quincenal",
      };

      setAdvModalOpen(false);
      setAdvAmount("");
      setAdvNotes("");
      setAdvVoucherData(voucher);
      setAdvVoucherModalOpen(true);
      loadPayroll();
    } catch (err: any) {
      alert(`Error al registrar anticipo: ${err.message}`);
    } finally {
      setAdvLoading(false);
    }
  };

  const handleRunPayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany || employees.length === 0) return;
    try {
      setRunLoading(true);
      const items = employees.map((emp) => {
        const salary = Number(emp.baseSalary || 7000);
        return {
          employeeId: emp.id,
          employeeName: emp.name,
          baseSalary: salary,
          bonus: 0,
          deductions: 0,
          advanceDeduction: 0,
          netPaid: salary,
        };
      });

      await payrollApi.runPayroll({
        companyId: activeCompany.id,
        period,
        paymentMethod: runPaymentMethod,
        items,
        notes: `Dispersión de nómina ${period}`,
      });
      setRunModalOpen(false);
      loadPayroll();
      if (employees.length > 0) {
        handleOpenReceiptForEmployee(employees[0], period);
      }
    } catch (err: any) {
      alert(`Error en corrida de nómina: ${err.message}`);
    } finally {
      setRunLoading(false);
    }
  };

  // KPIs
  const totalEmployees = employees.length;
  const totalPayrollBase = employees.reduce((sum, e) => sum + Number(e.baseSalary || 0), 0);
  const avgSalary = totalEmployees > 0 ? totalPayrollBase / totalEmployees : 0;
  const totalAdvances = advances.reduce((sum, a) => {
    const lines = a.lineList || [];
    const debitLine = lines.find((l: any) => Number(l.debit || 0) > 0);
    return sum + (debitLine ? Number(debitLine.debit) : 0);
  }, 0);

  // Filtered employees
  const filteredEmployees = employees.filter((emp) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (emp.name && emp.name.toLowerCase().includes(q)) ||
      (emp.code && emp.code.toLowerCase().includes(q)) ||
      (emp.taxId && emp.taxId.toLowerCase().includes(q)) ||
      (emp.jobTitle && emp.jobTitle.toLowerCase().includes(q))
    );
  });

const PAYROLL_CONFIGS: Record<
  PayrollTab,
  {
    title: string;
    subtitle: string;
    badge: string;
    badgeVariant: "primary" | "info" | "success" | "warning" | "danger" | "neutral";
  }
> = {
  EMPLOYEES: {
    title: "Directorio de Empleados & Colaboradores",
    subtitle: "Catálogo de personal, altas, puestos, salarios base y asignación de periodicidad",
    badge: "Nómina & RH",
    badgeVariant: "primary",
  },
  ADVANCES: {
    title: "Anticipos y Préstamos de Sueldo",
    subtitle: "Registro de vales a colaboradores y control de cuenta 107.01 (Anticipos a Personal)",
    badge: "Nómina & RH",
    badgeVariant: "warning",
  },
  RUNS: {
    title: "Planilla & Dispersión de Nómina",
    subtitle: "Cálculo ágil del periodo, deducción de anticipos y afectación contable a la cuenta 602.01",
    badge: "Nómina & RH",
    badgeVariant: "success",
  },
};

  const currentConfig = PAYROLL_CONFIGS[activeTab] || PAYROLL_CONFIGS.EMPLOYEES;

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

        {/* Global Quick Action Buttons */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadPayroll} loading={loading} className="gap-1.5 text-xs font-semibold">
            <RefreshCw className="w-3.5 h-3.5" /> Actualizar
          </Button>
          {activeTab === "EMPLOYEES" && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setEmpModalOpen(true)}
              className="gap-1.5 text-xs font-semibold"
              glow
            >
              <Plus className="w-3.5 h-3.5" /> Nuevo Empleado
            </Button>
          )}
          {activeTab === "ADVANCES" && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setAdvModalOpen(true)}
              className="gap-1.5 text-xs font-semibold"
              glow
            >
              <Coins className="w-3.5 h-3.5" /> Registrar Anticipo
            </Button>
          )}
          {activeTab === "RUNS" && (
            <Button
              variant="primary"
              glow
              size="sm"
              onClick={() => setRunModalOpen(true)}
              className="gap-1.5 text-xs font-semibold"
            >
              <Send className="w-3.5 h-3.5" /> Dispersar Nómina
            </Button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PESTAÑA 1: DIRECTORIO DE EMPLEADOS                                        */}
      {/* ========================================================================= */}
      {activeTab === "EMPLOYEES" && (
        <div className="space-y-5 animate-fade-in">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-etiserv-blue flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-medium">Total Colaboradores</span>
                <h4 className="text-xl font-heading font-bold text-slate-900 dark:text-white font-mono">
                  {totalEmployees}
                </h4>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-medium">Masa Salarial Quincenal</span>
                <h4 className="text-xl font-heading font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  ${totalPayrollBase.toFixed(2)}
                </h4>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-medium">Salario Quincenal Promedio</span>
                <h4 className="text-xl font-heading font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                  ${avgSalary.toFixed(2)}
                </h4>
              </div>
            </Card>
          </div>

          {/* Search & Actions Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#071C33] p-3 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por nombre, puesto o RFC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#061527] border border-slate-200 dark:border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-etiserv-blue"
              />
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setEmpModalOpen(true)}
              className="w-full sm:w-auto gap-1.5 text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" /> Nuevo Empleado
            </Button>
          </div>

          {/* Employee Table */}
          <div className="bg-white dark:bg-[#071C33] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-white/[0.02] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/10 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Código / Empleado</th>
                  <th className="p-3.5">Puesto & Función</th>
                  <th className="p-3.5">RFC / Tax ID</th>
                  <th className="p-3.5">Periodo</th>
                  <th className="p-3.5 text-right">Sueldo Base</th>
                  <th className="p-3.5 text-center">Estatus</th>
                  <th className="p-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                      No se encontraron empleados registrados. Haz clic en "Nuevo Empleado" para comenzar.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-etiserv-blue/10 text-etiserv-blue flex items-center justify-center font-bold font-heading uppercase text-xs">
                            {emp.name ? emp.name.slice(0, 2) : "EM"}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white block">
                              {emp.name}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {emp.code || `EMP-${emp.id}`}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-300">
                        {emp.jobTitle || "Colaborador General"}
                      </td>
                      <td className="p-3.5 font-mono text-slate-500 dark:text-slate-400">
                        {emp.taxId || "—"}
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-300">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 font-semibold text-[10px]">
                          {emp.paymentPeriod === "WEEKLY"
                            ? "Semanal"
                            : emp.paymentPeriod === "MONTHLY"
                            ? "Mensual"
                            : "Quincenal"}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-bold text-slate-900 dark:text-white font-mono">
                        ${Number(emp.baseSalary || 7000).toFixed(2)}
                      </td>
                      <td className="p-3.5 text-center">
                        <Badge variant="success" dot>
                          Activo
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenReceiptForEmployee(emp)}
                            className="text-[11px] font-semibold text-etiserv-blue dark:text-blue-400 hover:underline inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-950/40 px-2 py-1 rounded border border-blue-200 dark:border-blue-800/40"
                            title="Generar e imprimir recibo individual de nómina"
                          >
                            <FileText className="w-3 h-3" /> Recibo
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedEmpId(emp.id);
                              setAdvModalOpen(true);
                            }}
                            className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded border border-amber-200 dark:border-amber-800/40"
                            title="Otorgar anticipo de sueldo firmado"
                          >
                            <Coins className="w-3 h-3" /> Anticipo
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 2: ANTICIPOS Y PRÉSTAMOS DE SUELDO                                */}
      {/* ========================================================================= */}
      {activeTab === "ADVANCES" && (
        <div className="space-y-5 animate-fade-in">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-medium">Anticipos Otorgados</span>
                <h4 className="text-xl font-heading font-bold text-slate-900 dark:text-white font-mono">
                  {advances.length}
                </h4>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-medium">Monto Total de Anticipos</span>
                <h4 className="text-xl font-heading font-bold text-rose-600 dark:text-rose-400 font-mono">
                  ${totalAdvances.toFixed(2)}
                </h4>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-etiserv-blue flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-medium">Cuenta Contable Deudores</span>
                <h4 className="text-sm font-heading font-bold text-slate-800 dark:text-white font-mono mt-1">
                  107.01 Anticipos a Personal
                </h4>
              </div>
            </Card>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between bg-white dark:bg-[#071C33] p-3 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-white block">
                Libro de Vales & Préstamos de Sueldo
              </span>
              <span className="text-[10px] text-slate-400">
                Los anticipos registrados reducen el saldo a transferir en la nómina quincenal correspondiente.
              </span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setAdvModalOpen(true)}
              className="gap-1.5 text-xs font-semibold"
            >
              <Coins className="w-3.5 h-3.5" /> Registrar Anticipo
            </Button>
          </div>

          {/* Advances Table */}
          <div className="bg-white dark:bg-[#071C33] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-white/[0.02] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/10 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Asiento / Folio</th>
                  <th className="p-3.5">Colaborador / Concepto</th>
                  <th className="p-3.5">Fecha</th>
                  <th className="p-3.5">Método de Pago</th>
                  <th className="p-3.5 text-right">Monto Anticipo</th>
                  <th className="p-3.5 text-center">Estatus</th>
                  <th className="p-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {advances.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                      No hay anticipos registrados para este periodo.
                    </td>
                  </tr>
                ) : (
                  advances.map((adv, idx) => {
                    const lines = adv.lineList || [];
                    const debitLine = lines.find((l: any) => Number(l.debit || 0) > 0);
                    const amount = debitLine ? Number(debitLine.debit) : 0;

                    return (
                      <tr key={adv.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="p-3.5 font-mono text-etiserv-blue font-bold">
                          MOVE #{adv.id}
                        </td>
                        <td className="p-3.5">
                          <span className="font-semibold text-slate-900 dark:text-white block">
                            {typeof adv.origin === 'string' ? adv.origin : (adv.origin?.name || "Anticipo de Sueldo")}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Póliza de diario contable vinculada
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300">
                          {adv.date || adv.createdOn?.slice(0, 10) || "2026-08-29"}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                            Efectivo / Caja (101.01)
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-bold font-mono text-rose-600 dark:text-rose-400">
                          -${amount.toFixed(2)}
                        </td>
                        <td className="p-3.5 text-center">
                          <Badge variant="warning">Pendiente de Deducir</Badge>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenAdvanceVoucher(adv)}
                            className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded border border-amber-200 dark:border-amber-800/40"
                            title="Abrir y reimprimir vale de anticipo con firmas"
                          >
                            <Eye className="w-3 h-3" /> Ver Vale
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 3: PLANILLA & DISPERSIÓN DE NÓMINA                                */}
      {/* ========================================================================= */}
      {activeTab === "RUNS" && (
        <div className="space-y-5 animate-fade-in">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-medium">Corridas Realizadas</span>
                <h4 className="text-xl font-heading font-bold text-slate-900 dark:text-white font-mono">
                  {runs.length}
                </h4>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-etiserv-blue flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-medium">Periodo Actual en Curso</span>
                <h4 className="text-xl font-heading font-bold text-etiserv-blue font-mono">
                  {period}
                </h4>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-medium">Asiento de Gasto</span>
                <h4 className="text-sm font-heading font-bold text-slate-800 dark:text-white font-mono mt-1">
                  602.01 Sueldos y Salarios
                </h4>
              </div>
            </Card>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between bg-white dark:bg-[#071C33] p-3 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-white block">
                Historial de Planillas & Dispersiones Bancarias
              </span>
              <span className="text-[10px] text-slate-400">
                Cada corrida genera automáticamente la póliza de nómina y los comprobantes individuales.
              </span>
            </div>
            <Button
              variant="success"
              glow
              size="sm"
              onClick={() => setRunModalOpen(true)}
              className="gap-1.5 text-xs font-semibold"
            >
              <Send className="w-3.5 h-3.5" /> Dispersar Nómina
            </Button>
          </div>

          {/* Runs Table */}
          <div className="bg-white dark:bg-[#071C33] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-white/[0.02] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/10 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Folio / Periodo</th>
                  <th className="p-3.5">Concepto de Planilla</th>
                  <th className="p-3.5">Fecha Dispersión</th>
                  <th className="p-3.5">Colaboradores</th>
                  <th className="p-3.5 text-right">Total Dispersado</th>
                  <th className="p-3.5 text-center">Estatus</th>
                  <th className="p-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {runs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                      No se han registrado corridas de nómina. Haz clic en "Dispersar Nómina" para calcular y pagar el periodo.
                    </td>
                  </tr>
                ) : (
                  runs.map((run, idx) => {
                    const lines = run.lineList || [];
                    const creditLine = lines.find((l: any) => Number(l.credit || 0) > 0);
                    const totalPaid = creditLine ? Number(creditLine.credit) : totalPayrollBase;

                    return (
                      <tr key={run.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="p-3.5 font-mono text-emerald-600 font-bold">
                          {run.period || "2026-08-Q2"} (MOVE #{run.id})
                        </td>
                        <td className="p-3.5 font-semibold text-slate-900 dark:text-white">
                          {typeof run.origin === 'string' ? run.origin : (run.origin?.name || `Dispersión de Nómina ${run.period || period}`)}
                        </td>
                        <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300">
                          {run.date || run.createdOn?.slice(0, 10) || "2026-08-29"}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 font-semibold text-[10px]">
                            {employees.length} Empleados
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          ${totalPaid.toFixed(2)}
                        </td>
                        <td className="p-3.5 text-center">
                          <Badge variant="success">Dispersado</Badge>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRun(run);
                              setRunDetailsModalOpen(true);
                            }}
                            className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:underline inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded border border-emerald-200 dark:border-emerald-800/40"
                            title="Ver recibos individuales de esta nómina"
                          >
                            <Eye className="w-3 h-3" /> Ver Recibos
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALES                                                                   */}
      {/* ========================================================================= */}

      {/* Modal 1: Alta de Nuevo Empleado */}
      <Modal
        isOpen={empModalOpen}
        onClose={() => setEmpModalOpen(false)}
        title="Alta de Nuevo Empleado"
        maxWidth="md"
      >
        <form onSubmit={handleCreateEmployee} className="space-y-3.5">
          <Input
            label="Nombre Completo del Colaborador *"
            placeholder="Ej: Carlos Martínez López"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="RFC / CURP / Tax ID *"
              placeholder="MALC900101XYZ"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              required
            />
            <Input
              label="Puesto / Cargo"
              placeholder="Cajero / Vendedor"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Sueldo Base *"
              type="number"
              step="0.01"
              placeholder="7500.00"
              value={baseSalary}
              onChange={(e) => setBaseSalary(e.target.value)}
              required
            />
            <Select
              label="Periodicidad de Pago"
              value={paymentPeriod}
              onChange={(e) => setPaymentPeriod(e.target.value as any)}
            >
              <option value="BIWEEKLY">Quincenal (15 días)</option>
              <option value="WEEKLY">Semanal (7 días)</option>
              <option value="MONTHLY">Mensual (30 días)</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Teléfono Móvil"
              placeholder="55 1234 5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Input
              label="Correo Electrónico"
              placeholder="empleado@empresa.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
            <Button variant="outline" className="flex-1" type="button" onClick={() => setEmpModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" glow className="flex-1" type="submit" loading={createEmpLoading}>
              Guardar Empleado
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Registrar Anticipo de Sueldo */}
      <Modal
        isOpen={advModalOpen}
        onClose={() => setAdvModalOpen(false)}
        title="Registrar Anticipo o Préstamo de Sueldo"
        maxWidth="md"
      >
        <form onSubmit={handleCreateAdvance} className="space-y-3.5">
          <Autocomplete
            label="Colaborador Solicitante (Búsqueda Inteligente)"
            placeholder="Selecciona o busca un colaborador..."
            searchPlaceholder="Escribe nombre, puesto, RFC o código de empleado..."
            items={employees.map((emp) => ({
              id: emp.id,
              title: emp.name,
              subtitle: `Puesto: ${emp.jobTitle || "General"} • Cód: ${emp.code || `EMP-${emp.id}`} • Base: $${Number(emp.baseSalary || 0).toFixed(2)}`,
              badge: emp.paymentPeriod === "WEEKLY" ? "Semanal" : "Quincenal",
              icon: "user" as const,
            }))}
            value={selectedEmpId}
            onChange={(item) => setSelectedEmpId(Number(item.id))}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Importe del Anticipo ($) *"
              type="number"
              step="0.01"
              placeholder="1500.00"
              value={advAmount}
              onChange={(e) => setAdvAmount(e.target.value)}
              required
              autoFocus
            />
            <Select
              label="Medio de Entrega"
              value={advPaymentMethod}
              onChange={(e) => setAdvPaymentMethod(e.target.value as any)}
            >
              <option value="CASH">Efectivo (Caja Chica 101.01)</option>
              <option value="BANK">Transferencia / Banco (102.01)</option>
            </Select>
          </div>

          <Input
            label="Motivo o Notas"
            placeholder="Ej: Anticipo médico de quincena"
            value={advNotes}
            onChange={(e) => setAdvNotes(e.target.value)}
          />

          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300">
            <strong>Efecto Contable:</strong> Se cargará la cuenta <code>107.01 (Anticipos a Personal)</code> con abono a tesorería. El monto será descontado en el próximo cálculo de nómina.
          </div>

          <div className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
            <Button variant="outline" className="flex-1" type="button" onClick={() => setAdvModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" glow className="flex-1" type="submit" loading={advLoading}>
              Entregar Anticipo
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Dispersión de Nómina */}
      <Modal
        isOpen={runModalOpen}
        onClose={() => setRunModalOpen(false)}
        title="Dispersión y Cálculo de Nómina"
        maxWidth="md"
      >
        <form onSubmit={handleRunPayroll} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Periodo de Nómina *"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="2026-08-Q2"
              required
            />
            <Select
              label="Cuenta de Pago"
              value={runPaymentMethod}
              onChange={(e) => setRunPaymentMethod(e.target.value as any)}
            >
              <option value="BANK">Banco / Dispersión SPEI (102.01)</option>
              <option value="CASH">Efectivo en Sobre (101.01)</option>
            </Select>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-etiserv-navyDark border border-slate-100 dark:border-white/10 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Colaboradores a pagar:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{employees.length}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Masa Salarial Bruta:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">${totalPayrollBase.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200/60 dark:border-white/10">
              <span>Total Neto a Transferir:</span>
              <span className="text-base text-emerald-600 font-mono">
                ${totalPayrollBase.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300">
            <strong>Asiento Contable:</strong> Se generará automáticamente el cargo a <code>602.01 (Sueldos y Salarios)</code> con abono a la cuenta de dispersión seleccionada.
          </div>

          <div className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
            <Button variant="outline" className="flex-1" type="button" onClick={() => setRunModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="success" glow className="flex-1" type="submit" loading={runLoading}>
              Confirmar Dispersión
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 4: Detalle de Corrida de Nómina & Lista de Recibos */}
      <Modal
        isOpen={runDetailsModalOpen}
        onClose={() => setRunDetailsModalOpen(false)}
        title={`Recibos de Nómina • ${selectedRun?.period || period}`}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10">
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">
                {selectedRun?.origin || `Dispersión de Nómina ${period}`}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Póliza Contable MOVE #{selectedRun?.id} • Fecha: {selectedRun?.date || "2026-08-29"}
              </span>
            </div>
            <Badge variant="success">Dispersado</Badge>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-white/5 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-2.5">Empleado</th>
                  <th className="p-2.5">Puesto</th>
                  <th className="p-2.5 text-right">Sueldo Base</th>
                  <th className="p-2.5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                    <td className="p-2.5 font-semibold text-slate-900 dark:text-white">
                      {emp.name}
                      <span className="block text-[10px] text-slate-400 font-mono">RFC: {emp.taxId || "—"}</span>
                    </td>
                    <td className="p-2.5 text-slate-600 dark:text-slate-300">{emp.jobTitle || "General"}</td>
                    <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ${Number(emp.baseSalary || 7000).toFixed(2)}
                    </td>
                    <td className="p-2.5 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenReceiptForEmployee(emp, selectedRun?.period || period)}
                        className="text-[11px] py-1 px-2.5 gap-1 font-semibold text-etiserv-blue"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Ver Recibo</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setRunDetailsModalOpen(false)}>
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL OFICIAL: RECIBO DE NÓMINA IMPRIMIBLE */}
      <PayrollReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        receiptData={receiptData}
      />

      {/* MODAL OFICIAL: VALE DE ANTICIPO IMPRIMIBLE */}
      <AdvanceVoucherModal
        isOpen={advVoucherModalOpen}
        onClose={() => setAdvVoucherModalOpen(false)}
        voucherData={advVoucherData}
      />
    </div>
  );
};
