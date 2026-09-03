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
  Lock,
  Edit2,
  Trash2,
  XCircle,
  Check,
  Ban,
  Clock,
  ArrowRight,
  ShieldCheck,
  DollarSign,
  AlertTriangle,
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

export type PayrollTab = "EMPLOYEES" | "PERIODS" | "ADVANCES" | "RUNS";

interface PayrollViewProps {
  initialTab?: PayrollTab;
}

export const PayrollView: React.FC<PayrollViewProps> = ({ initialTab }) => {
  const { activeCompany, formatCurrency } = useCompany();
  const [activeTab, setActiveTab] = useState<PayrollTab>(initialTab || "EMPLOYEES");

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Main State
  const [employees, setEmployees] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Filters
  const [empDepartmentFilter, setEmpDepartmentFilter] = useState("ALL");
  const [empStatusFilter, setEmpStatusFilter] = useState("ALL");
  const [advStatusFilter, setAdvStatusFilter] = useState("ALL");
  const [advPeriodFilter, setAdvPeriodFilter] = useState("ALL");

  // Employee Modal (Create & Edit)
  const [empModalOpen, setEmpModalOpen] = useState(false);
  const [editingEmpId, setEditingEmpId] = useState<number | null>(null);
  const [empName, setEmpName] = useState("");
  const [empCode, setEmpCode] = useState("");
  const [empTaxId, setEmpTaxId] = useState("");
  const [empJobTitle, setEmpJobTitle] = useState("");
  const [empDepartment, setEmpDepartment] = useState("Ventas");
  const [empBaseSalary, setEmpBaseSalary] = useState("");
  const [empPaymentPeriod, setEmpPaymentPeriod] = useState<"WEEKLY" | "BIWEEKLY" | "MONTHLY">("BIWEEKLY");
  const [empPhone, setEmpPhone] = useState("");
  const [empEmail, setEmpEmail] = useState("");
  const [empBankName, setEmpBankName] = useState("BBVA Bancomer");
  const [empBankAccount, setEmpBankAccount] = useState("");
  const [empClabe, setEmpClabe] = useState("");
  const [empHireDate, setEmpHireDate] = useState(new Date().toISOString().slice(0, 10));
  const [empStatus, setEmpStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [empSaving, setEmpSaving] = useState(false);

  // Period Modal (Create & Edit)
  const [periodModalOpen, setPeriodModalOpen] = useState(false);
  const [editingPeriodId, setEditingPeriodId] = useState<number | null>(null);
  const [periodCode, setPeriodCode] = useState("");
  const [periodName, setPeriodName] = useState("");
  const [periodType, setPeriodType] = useState<"WEEKLY" | "BIWEEKLY" | "MONTHLY">("BIWEEKLY");
  const [periodStartDate, setPeriodStartDate] = useState("2026-09-01");
  const [periodEndDate, setPeriodEndDate] = useState("2026-09-15");
  const [periodPaymentDate, setPeriodPaymentDate] = useState("2026-09-15");
  const [periodNotes, setPeriodNotes] = useState("");
  const [periodSaving, setPeriodSaving] = useState(false);

  // Advance Modal (Create & Edit)
  const [advModalOpen, setAdvModalOpen] = useState(false);
  const [editingAdvId, setEditingAdvId] = useState<number | null>(null);
  const [selectedEmpId, setSelectedEmpId] = useState<number>(0);
  const [advPeriodCode, setAdvPeriodCode] = useState("2026-09-Q1");
  const [advAmount, setAdvAmount] = useState("");
  const [advPaymentMethod, setAdvPaymentMethod] = useState<"CASH" | "BANK">("CASH");
  const [advDate, setAdvDate] = useState(new Date().toISOString().slice(0, 10));
  const [advNotes, setAdvNotes] = useState("");
  const [advSaving, setAdvSaving] = useState(false);

  // Advance Authorization Modal
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authorizingAdv, setAuthorizingAdv] = useState<any>(null);
  const [authPaymentMethod, setAuthPaymentMethod] = useState<"CASH" | "BANK">("CASH");
  const [authLoading, setAuthLoading] = useState(false);

  // Interactive Pre-Payroll & Run State
  const [selectedRunPeriod, setSelectedRunPeriod] = useState("2026-09-Q1");
  const [payrollPreviewItems, setPayrollPreviewItems] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [runConfirmModalOpen, setRunConfirmModalOpen] = useState(false);
  const [runPaymentMethod, setRunPaymentMethod] = useState<"CASH" | "BANK">("BANK");
  const [runNotes, setRunNotes] = useState("Dispersión de nómina quincenal");
  const [runLoading, setRunLoading] = useState(false);

  // Document Modals State
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<PayrollReceiptData | null>(null);
  const [advVoucherModalOpen, setAdvVoucherModalOpen] = useState(false);
  const [advVoucherData, setAdvVoucherData] = useState<AdvanceVoucherData | null>(null);
  const [runDetailsModalOpen, setRunDetailsModalOpen] = useState(false);
  const [selectedRun, setSelectedRun] = useState<any>(null);

  // Load All Data
  const loadPayroll = async () => {
    if (!activeCompany) return;
    try {
      setLoading(true);
      const [empData, perData, advData, runsData] = await Promise.all([
        payrollApi.listEmployees(activeCompany.id),
        payrollApi.listPeriods(activeCompany.id),
        payrollApi.listAdvances(activeCompany.id),
        payrollApi.listRuns(activeCompany.id),
      ]);
      setEmployees(empData || []);
      setPeriods(perData || []);
      setAdvances(advData || []);
      setRuns(runsData || []);

      if (empData?.length > 0 && !selectedEmpId) {
        setSelectedEmpId(empData[0].id);
      }
      if (perData?.length > 0 && !selectedRunPeriod) {
        const openP = perData.find((p: any) => p.status === "OPEN") || perData[0];
        setSelectedRunPeriod(openP.code);
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

  // Load preview whenever selectedRunPeriod changes
  const loadPreview = async (periodCode: string) => {
    if (!activeCompany || !periodCode) return;
    try {
      setPreviewLoading(true);
      const preview = await payrollApi.getPayrollPreview(activeCompany.id, periodCode);
      if (preview?.items) {
        setPayrollPreviewItems(preview.items);
      }
    } catch (err) {
      console.error("Error al obtener preview de nómina:", err);
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "RUNS" && selectedRunPeriod) {
      loadPreview(selectedRunPeriod);
    }
  }, [activeTab, selectedRunPeriod, activeCompany]);

  // ==========================================
  // HANDLERS: EMPLEADOS (CREATE & UPDATE)
  // ==========================================

  const handleOpenNewEmployee = () => {
    setEditingEmpId(null);
    setEmpName("");
    setEmpCode(`EMP-${Math.floor(100 + Math.random() * 900)}`);
    setEmpTaxId("");
    setEmpJobTitle("Colaborador General");
    setEmpDepartment("Ventas");
    setEmpBaseSalary("7500.00");
    setEmpPaymentPeriod("BIWEEKLY");
    setEmpPhone("");
    setEmpEmail("");
    setEmpBankName("BBVA Bancomer");
    setEmpBankAccount("");
    setEmpClabe("");
    setEmpHireDate(new Date().toISOString().slice(0, 10));
    setEmpStatus("ACTIVE");
    setEmpModalOpen(true);
  };

  const handleOpenEditEmployee = (emp: any) => {
    setEditingEmpId(emp.id);
    setEmpName(emp.name);
    setEmpCode(emp.code || `EMP-${emp.id}`);
    setEmpTaxId(emp.taxId || "");
    setEmpJobTitle(emp.jobTitle || "Colaborador General");
    setEmpDepartment(emp.department || "General");
    setEmpBaseSalary(String(emp.baseSalary || 7500));
    setEmpPaymentPeriod(emp.paymentPeriod || "BIWEEKLY");
    setEmpPhone(emp.phone || "");
    setEmpEmail(emp.email || "");
    setEmpBankName(emp.bankName || "BBVA Bancomer");
    setEmpBankAccount(emp.bankAccount || "");
    setEmpClabe(emp.clabe || "");
    setEmpHireDate(emp.hireDate || "2024-01-15");
    setEmpStatus(emp.status || "ACTIVE");
    setEmpModalOpen(true);
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany || !empName || !empTaxId || !empBaseSalary) return;
    try {
      setEmpSaving(true);
      if (editingEmpId) {
        await payrollApi.updateEmployee(editingEmpId, {
          name: empName,
          code: empCode,
          taxId: empTaxId,
          jobTitle: empJobTitle,
          department: empDepartment,
          baseSalary: parseFloat(empBaseSalary),
          paymentPeriod: empPaymentPeriod,
          phone: empPhone,
          email: empEmail,
          bankName: empBankName,
          bankAccount: empBankAccount,
          clabe: empClabe,
          hireDate: empHireDate,
          status: empStatus,
        });
      } else {
        await payrollApi.createEmployee({
          companyId: activeCompany.id,
          name: empName,
          code: empCode,
          taxId: empTaxId,
          jobTitle: empJobTitle,
          department: empDepartment,
          baseSalary: parseFloat(empBaseSalary),
          paymentPeriod: empPaymentPeriod,
          phone: empPhone,
          email: empEmail,
          bankName: empBankName,
          bankAccount: empBankAccount,
          clabe: empClabe,
          hireDate: empHireDate,
        });
      }
      setEmpModalOpen(false);
      loadPayroll();
    } catch (err: any) {
      alert(`Error al guardar empleado: ${err.message}`);
    } finally {
      setEmpSaving(false);
    }
  };

  const handleToggleEmployeeStatus = async (emp: any) => {
    const newStatus = emp.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const msg =
      newStatus === "INACTIVE"
        ? `¿Confirmas dar de baja al colaborador ${emp.name}? No se incluirá en las próximas corridas de nómina.`
        : `¿Reactivar al colaborador ${emp.name}?`;
    if (!window.confirm(msg)) return;

    try {
      await payrollApi.updateEmployee(emp.id, { status: newStatus });
      loadPayroll();
    } catch (err: any) {
      alert(`Error al cambiar estatus: ${err.message}`);
    }
  };

  // ==========================================
  // HANDLERS: PERIODOS DE NÓMINA (CREATE & EDIT)
  // ==========================================

  const handleOpenNewPeriod = () => {
    setEditingPeriodId(null);
    setPeriodCode("2026-10-Q1");
    setPeriodName("1ra Quincena de Octubre 2026");
    setPeriodType("BIWEEKLY");
    setPeriodStartDate("2026-10-01");
    setPeriodEndDate("2026-10-15");
    setPeriodPaymentDate("2026-10-15");
    setPeriodNotes("Periodo ordinario");
    setPeriodModalOpen(true);
  };

  const handleOpenEditPeriod = (period: any) => {
    setEditingPeriodId(period.id);
    setPeriodCode(period.code);
    setPeriodName(period.name);
    setPeriodType(period.periodType || "BIWEEKLY");
    setPeriodStartDate(period.startDate);
    setPeriodEndDate(period.endDate);
    setPeriodPaymentDate(period.paymentDate);
    setPeriodNotes(period.notes || "");
    setPeriodModalOpen(true);
  };

  const handleSavePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany || !periodCode || !periodName) return;
    try {
      setPeriodSaving(true);
      if (editingPeriodId) {
        await payrollApi.updatePeriod(editingPeriodId, {
          code: periodCode,
          name: periodName,
          periodType,
          startDate: periodStartDate,
          endDate: periodEndDate,
          paymentDate: periodPaymentDate,
          notes: periodNotes,
        });
      } else {
        await payrollApi.createPeriod({
          companyId: activeCompany.id,
          code: periodCode,
          name: periodName,
          periodType,
          startDate: periodStartDate,
          endDate: periodEndDate,
          paymentDate: periodPaymentDate,
          notes: periodNotes,
        });
      }
      setPeriodModalOpen(false);
      loadPayroll();
    } catch (err: any) {
      alert(`Error al guardar periodo: ${err.message}`);
    } finally {
      setPeriodSaving(false);
    }
  };

  // ==========================================
  // HANDLERS: ANTICIPOS & INMUTABILIDAD
  // ==========================================

  const handleOpenNewAdvance = (empId?: number) => {
    setEditingAdvId(null);
    if (empId) setSelectedEmpId(empId);
    setAdvAmount("");
    setAdvPeriodCode(selectedRunPeriod || "2026-09-Q1");
    setAdvPaymentMethod("CASH");
    setAdvDate(new Date().toISOString().slice(0, 10));
    setAdvNotes("Solicitud de anticipo quincenal");
    setAdvModalOpen(true);
  };

  const handleOpenEditAdvance = (adv: any) => {
    if (adv.status === "AUTHORIZED" || adv.status === "DEDUCTED") {
      alert(
        "❌ BLOQUEO DE CONTROL INTERNO: Este anticipo ya fue AUTORIZADO y desembolsado contablemente. " +
          "Por integridad financiera, los anticipos autorizados son INMUTABLES y no pueden ser modificados."
      );
      return;
    }

    setEditingAdvId(adv.id);
    setSelectedEmpId(adv.employeeId);
    setAdvAmount(String(adv.amount));
    setAdvPeriodCode(adv.periodCode || "2026-09-Q1");
    setAdvPaymentMethod(adv.paymentMethod || "CASH");
    setAdvDate(adv.date || new Date().toISOString().slice(0, 10));
    setAdvNotes(adv.notes || "");
    setAdvModalOpen(true);
  };

  const handleSaveAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany || !selectedEmpId || !advAmount) return;
    try {
      setAdvSaving(true);
      if (editingAdvId) {
        await payrollApi.updateAdvance(editingAdvId, {
          amount: parseFloat(advAmount),
          paymentMethod: advPaymentMethod,
          date: advDate,
          notes: advNotes,
          periodCode: advPeriodCode,
        });
      } else {
        await payrollApi.createAdvance({
          companyId: activeCompany.id,
          employeeId: selectedEmpId,
          amount: parseFloat(advAmount),
          paymentMethod: advPaymentMethod,
          date: advDate,
          notes: advNotes,
          periodCode: advPeriodCode,
        });
      }
      setAdvModalOpen(false);
      loadPayroll();
    } catch (err: any) {
      alert(`Error al registrar anticipo: ${err.message}`);
    } finally {
      setAdvSaving(false);
    }
  };

  const handleOpenAuthorizeModal = (adv: any) => {
    setAuthorizingAdv(adv);
    setAuthPaymentMethod(adv.paymentMethod || "CASH");
    setAuthModalOpen(true);
  };

  const handleConfirmAuthorizeAdvance = async () => {
    if (!activeCompany || !authorizingAdv) return;
    try {
      setAuthLoading(true);
      await payrollApi.authorizeAdvance(authorizingAdv.id, {
        companyId: activeCompany.id,
        paymentMethod: authPaymentMethod,
        authorizedBy: "Administrador General",
      });
      setAuthModalOpen(false);
      loadPayroll();

      // Open printable voucher
      const voucher: AdvanceVoucherData = {
        voucherNumber: `ADV-${String(authorizingAdv.id).padStart(5, "0")}`,
        companyName: activeCompany.name || "Distribuidora Nacional PyME S.A.",
        companyTaxId: activeCompany.taxId || "DNP190820KX1",
        date: new Date().toLocaleDateString("es-MX"),
        employeeName: authorizingAdv.employeeName,
        employeeTaxId: "XAXX010101000",
        employeeCode: authorizingAdv.employeeCode || `EMP-${authorizingAdv.employeeId}`,
        jobTitle: "Colaborador",
        amount: Number(authorizingAdv.amount),
        paymentMethod: authPaymentMethod,
        notes: authorizingAdv.notes || "Anticipo de sueldo autorizado",
      };
      setAdvVoucherData(voucher);
      setAdvVoucherModalOpen(true);
    } catch (err: any) {
      alert(`Error al autorizar anticipo: ${err.message}`);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRejectAdvance = async (adv: any) => {
    const reason = window.prompt("Ingresa el motivo del rechazo del anticipo:");
    if (reason === null) return;
    try {
      await payrollApi.rejectAdvance(adv.id, reason);
      loadPayroll();
    } catch (err: any) {
      alert(`Error al rechazar anticipo: ${err.message}`);
    }
  };

  // ==========================================
  // HANDLERS: PRE-NÓMINA & DISPERSIÓN DINÁMICA
  // ==========================================

  const handleUpdatePreviewItem = (index: number, field: string, value: number) => {
    setPayrollPreviewItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: Math.max(0, value) };

      const base = Number(item.baseSalary || 0);
      const bonus = Number(item.bonus || 0);
      const overtime = Number(item.overtime || 0);
      const gross = Number((base + bonus + overtime).toFixed(2));

      const tax = Number(item.taxDeduction || 0);
      const imss = Number(item.imssDeduction || 0);
      const other = Number(item.otherDeductions || 0);
      const adv = Number(item.advanceDeduction || 0);

      const net = Number(Math.max(0, gross - (tax + imss + other + adv)).toFixed(2));

      item.gross = gross;
      item.netPaid = net;
      updated[index] = item;
      return updated;
    });
  };

  const handleConfirmRunPayroll = async () => {
    if (!activeCompany || payrollPreviewItems.length === 0) return;
    try {
      setRunLoading(true);
      const res = await payrollApi.runPayroll({
        companyId: activeCompany.id,
        period: selectedRunPeriod,
        paymentMethod: runPaymentMethod,
        items: payrollPreviewItems,
        notes: runNotes,
      });

      setRunConfirmModalOpen(false);
      loadPayroll();
      alert(`✅ Nómina ${selectedRunPeriod} dispersada exitosamente. Se generó la póliza MOVE #${res.moveId}`);

      if (payrollPreviewItems.length > 0) {
        handleOpenReceiptForEmployee(payrollPreviewItems[0], selectedRunPeriod);
      }
    } catch (err: any) {
      alert(`Error al dispersar nómina: ${err.message}`);
    } finally {
      setRunLoading(false);
    }
  };

  // Helper para abrir recibo de nómina individual
  const handleOpenReceiptForEmployee = (empItem: any, runPeriod = selectedRunPeriod) => {
    if (!activeCompany) return;
    const base = Number(empItem.baseSalary || 7500);
    const bonus = Number(empItem.bonus || 0);
    const overtime = Number(empItem.overtime || 0);
    const gross = Number((base + bonus + overtime).toFixed(2));

    const tax = Number(empItem.taxDeduction || (gross * 0.08).toFixed(2));
    const imss = Number(empItem.imssDeduction || (gross * 0.025).toFixed(2));
    const adv = Number(empItem.advanceDeduction || 0);
    const other = Number(empItem.otherDeductions || 0);
    const totalDeductions = Number((tax + imss + adv + other).toFixed(2));
    const netPay = Number((gross - totalDeductions).toFixed(2));

    const receipt: PayrollReceiptData = {
      receiptNumber: `REC-${String(empItem.employeeId || empItem.id || 1).padStart(4, "0")}-${runPeriod.replace(/[^a-zA-Z0-9]/g, "")}`,
      companyName: activeCompany.name || "Distribuidora Nacional PyME S.A.",
      companyTaxId: activeCompany.taxId || "DNP190820KX1",
      period: runPeriod,
      date: new Date().toLocaleDateString("es-MX"),
      employeeName: empItem.employeeName || empItem.name,
      employeeTaxId: empItem.taxId || "XAXX010101000",
      employeeCode: empItem.employeeCode || empItem.code || `EMP-${empItem.employeeId || empItem.id}`,
      jobTitle: empItem.jobTitle || "Colaborador General",
      paymentPeriod:
        empItem.paymentPeriod === "WEEKLY"
          ? "Semanal"
          : empItem.paymentPeriod === "MONTHLY"
          ? "Mensual"
          : "Quincenal",
      paymentMethod: "Transferencia SPEI / Banco",
      baseSalary: base,
      bonus,
      overtime,
      totalGross: gross,
      taxDeduction: tax,
      imssDeduction: imss,
      advanceDeduction: adv,
      otherDeductions: other,
      totalDeductions,
      netPay,
    };

    setReceiptData(receipt);
    setReceiptModalOpen(true);
  };

  // Totales de la Pre-Nómina activa
  const previewGrossTotal = payrollPreviewItems.reduce((s, it) => s + Number(it.gross || it.baseSalary || 0), 0);
  const previewTaxTotal = payrollPreviewItems.reduce((s, it) => s + Number(it.taxDeduction || 0) + Number(it.imssDeduction || 0) + Number(it.otherDeductions || 0), 0);
  const previewAdvTotal = payrollPreviewItems.reduce((s, it) => s + Number(it.advanceDeduction || 0), 0);
  const previewNetTotal = payrollPreviewItems.reduce((s, it) => s + Number(it.netPaid || 0), 0);

  // KPIs Generales
  const totalEmployees = employees.filter((e) => e.status === "ACTIVE").length;
  const totalPayrollBase = employees
    .filter((e) => e.status === "ACTIVE")
    .reduce((sum, e) => sum + Number(e.baseSalary || 0), 0);
  const avgSalary = totalEmployees > 0 ? totalPayrollBase / totalEmployees : 0;
  const totalAuthorizedAdvances = advances
    .filter((a) => a.status === "AUTHORIZED")
    .reduce((sum, a) => sum + Number(a.amount || 0), 0);

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
      subtitle: "Catálogo de personal, altas, edición de salarios, puestos y cuentas bancarias",
      badge: "Recursos Humanos",
      badgeVariant: "primary",
    },
    PERIODS: {
      title: "Periodos de Nómina & Calendario Fiscal",
      subtitle: "Gestión de quincenas y semanas de pago, fechas de corte y control de periodos",
      badge: "Periodos",
      badgeVariant: "info",
    },
    ADVANCES: {
      title: "Anticipos y Préstamos de Sueldo",
      subtitle: "Gestión de solicitudes, autorización contable (107.01) y regla de inmutabilidad",
      badge: "Tesorería & RH",
      badgeVariant: "warning",
    },
    RUNS: {
      title: "Planilla, Pre-Nómina & Dispersión",
      subtitle: "Grilla interactiva con cálculo de bonos, impuestos, deducción de anticipos y póliza 602.01",
      badge: "Dispersión",
      badgeVariant: "success",
    },
  };

  const currentConfig = PAYROLL_CONFIGS[activeTab] || PAYROLL_CONFIGS.EMPLOYEES;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Sub-Tab Switcher */}
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

        {/* Global Quick Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadPayroll}
            loading={loading}
            className="gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Actualizar
          </Button>
          {activeTab === "EMPLOYEES" && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenNewEmployee}
              className="gap-1.5 text-xs font-semibold"
              glow
            >
              <Plus className="w-3.5 h-3.5" /> Nuevo Empleado
            </Button>
          )}
          {activeTab === "PERIODS" && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenNewPeriod}
              className="gap-1.5 text-xs font-semibold"
              glow
            >
              <Calendar className="w-3.5 h-3.5" /> Nuevo Periodo
            </Button>
          )}
          {activeTab === "ADVANCES" && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenNewAdvance()}
              className="gap-1.5 text-xs font-semibold"
              glow
            >
              <Coins className="w-3.5 h-3.5" /> Registrar Anticipo
            </Button>
          )}
          {activeTab === "RUNS" && (
            <Button
              variant="success"
              glow
              size="sm"
              onClick={() => setRunConfirmModalOpen(true)}
              disabled={payrollPreviewItems.length === 0}
              className="gap-1.5 text-xs font-semibold"
            >
              <Send className="w-3.5 h-3.5" /> Dispersar Nómina ({formatCurrency(previewNetTotal)})
            </Button>
          )}
        </div>
      </div>

      {/* View Sub-Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200/80 dark:border-white/10 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("EMPLOYEES")}
          className={clsx(
            "px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap",
            activeTab === "EMPLOYEES"
              ? "bg-white dark:bg-[#06172A] text-etiserv-blue shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          )}
        >
          <Users className="w-4 h-4" />
          <span>👥 Directorio de Empleados ({employees.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("PERIODS")}
          className={clsx(
            "px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap",
            activeTab === "PERIODS"
              ? "bg-white dark:bg-[#06172A] text-etiserv-blue shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          )}
        >
          <Calendar className="w-4 h-4" />
          <span>📅 Periodos de Nómina ({periods.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("ADVANCES")}
          className={clsx(
            "px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap",
            activeTab === "ADVANCES"
              ? "bg-white dark:bg-[#06172A] text-etiserv-blue shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          )}
        >
          <Coins className="w-4 h-4" />
          <span>💸 Anticipos & Préstamos ({advances.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("RUNS")}
          className={clsx(
            "px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap",
            activeTab === "RUNS"
              ? "bg-white dark:bg-[#06172A] text-emerald-600 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          )}
        >
          <Receipt className="w-4 h-4" />
          <span>📊 Planilla & Dispersión</span>
        </button>
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
                <span className="text-[11px] text-slate-400 font-medium">Colaboradores Activos</span>
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
                <span className="text-[11px] text-slate-400 font-medium">Masa Salarial Quincenal Base</span>
                <h4 className="text-xl font-heading font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatCurrency(totalPayrollBase)}
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
                  {formatCurrency(avgSalary)}
                </h4>
              </div>
            </Card>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#071C33] p-3 rounded-xl border border-slate-200 dark:border-white/10 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por nombre, puesto, RFC o departamento..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#061527] border border-slate-200 dark:border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-etiserv-blue"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={empDepartmentFilter}
                onChange={(e) => setEmpDepartmentFilter(e.target.value)}
                className="text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071C33] p-2 text-slate-900 dark:text-white"
              >
                <option value="ALL">Todos los Departamentos</option>
                <option value="Ventas">Ventas & Mostrador</option>
                <option value="Almacén">Almacén & Logística</option>
                <option value="Administración">Administración & Finanzas</option>
                <option value="General">General</option>
              </select>

              <select
                value={empStatusFilter}
                onChange={(e) => setEmpStatusFilter(e.target.value)}
                className="text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071C33] p-2 text-slate-900 dark:text-white"
              >
                <option value="ALL">Todos los Estatus</option>
                <option value="ACTIVE">Solo Activos</option>
                <option value="INACTIVE">Solo Inactivos (Bajas)</option>
              </select>
            </div>
          </div>

          {/* Employee Table */}
          <div className="bg-white dark:bg-[#071C33] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-white/[0.02] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/10 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Código / Colaborador</th>
                  <th className="p-3.5">Puesto & Departamento</th>
                  <th className="p-3.5">RFC / Tax ID</th>
                  <th className="p-3.5">Banco & CLABE</th>
                  <th className="p-3.5">Periodo</th>
                  <th className="p-3.5 text-right">Sueldo Base</th>
                  <th className="p-3.5 text-center">Estatus</th>
                  <th className="p-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {employees
                  .filter((emp) => {
                    if (empDepartmentFilter !== "ALL" && emp.department !== empDepartmentFilter) return false;
                    if (empStatusFilter !== "ALL" && emp.status !== empStatusFilter) return false;
                    if (!searchQuery) return true;
                    const q = searchQuery.toLowerCase();
                    return (
                      (emp.name && emp.name.toLowerCase().includes(q)) ||
                      (emp.code && emp.code.toLowerCase().includes(q)) ||
                      (emp.taxId && emp.taxId.toLowerCase().includes(q)) ||
                      (emp.jobTitle && emp.jobTitle.toLowerCase().includes(q)) ||
                      (emp.department && emp.department.toLowerCase().includes(q))
                    );
                  })
                  .map((emp) => (
                    <tr
                      key={emp.id}
                      className={clsx(
                        "hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors",
                        emp.status === "INACTIVE" && "opacity-60 bg-slate-50/30 dark:bg-white/[0.01]"
                      )}
                    >
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={clsx(
                              "w-8 h-8 rounded-full flex items-center justify-center font-bold font-heading uppercase text-xs",
                              emp.status === "ACTIVE"
                                ? "bg-etiserv-blue/10 text-etiserv-blue"
                                : "bg-slate-200 text-slate-500"
                            )}
                          >
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
                      <td className="p-3.5">
                        <span className="text-slate-700 dark:text-slate-200 font-semibold block">
                          {emp.jobTitle || "Colaborador General"}
                        </span>
                        <span className="text-[10px] text-slate-400">{emp.department || "General"}</span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-500 dark:text-slate-400">
                        {emp.taxId || "—"}
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        {emp.bankName || "BBVA"}
                        {emp.clabe && (
                          <span className="text-[10px] text-slate-400 block">CLABE: {emp.clabe.slice(-6)}</span>
                        )}
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
                        {formatCurrency(Number(emp.baseSalary || 7000))}
                      </td>
                      <td className="p-3.5 text-center">
                        {emp.status === "ACTIVE" ? (
                          <Badge variant="success" dot>
                            Activo
                          </Badge>
                        ) : (
                          <Badge variant="neutral" dot>
                            Inactivo (Baja)
                          </Badge>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditEmployee(emp)}
                            className="text-[11px] font-semibold text-slate-600 hover:text-etiserv-blue inline-flex items-center gap-1 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded border border-slate-200 dark:border-white/10"
                            title="Editar datos del colaborador"
                          >
                            <Edit2 className="w-3 h-3" /> Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenReceiptForEmployee(emp)}
                            className="text-[11px] font-semibold text-etiserv-blue inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-950/40 px-2 py-1 rounded border border-blue-200 dark:border-blue-800/40"
                            title="Generar recibo de nómina"
                          >
                            <FileText className="w-3 h-3" /> Recibo
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenNewAdvance(emp.id)}
                            className="text-[11px] font-semibold text-amber-600 inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded border border-amber-200 dark:border-amber-800/40"
                            title="Registrar anticipo de sueldo"
                          >
                            <Coins className="w-3 h-3" /> Anticipo
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleEmployeeStatus(emp)}
                            className={clsx(
                              "text-[11px] font-semibold inline-flex items-center gap-1 px-2 py-1 rounded border",
                              emp.status === "ACTIVE"
                                ? "text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/40"
                                : "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40"
                            )}
                            title={emp.status === "ACTIVE" ? "Dar de baja" : "Reactivar"}
                          >
                            {emp.status === "ACTIVE" ? <Trash2 className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 2: PERIODOS DE NÓMINA                                             */}
      {/* ========================================================================= */}
      {activeTab === "PERIODS" && (
        <div className="space-y-5 animate-fade-in">
          <div className="flex items-center justify-between bg-white dark:bg-[#071C33] p-3 rounded-xl border border-slate-200 dark:border-white/10 shadow-xs">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-white block">
                Calendario & Catálogo de Periodos de Nómina
              </span>
              <span className="text-[10px] text-slate-400">
                Define las fechas de corte, periodicidad y días límite de dispersión contable.
              </span>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenNewPeriod}
              className="gap-1.5 text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" /> Nuevo Periodo
            </Button>
          </div>

          <div className="bg-white dark:bg-[#071C33] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-white/[0.02] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/10 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Código de Periodo</th>
                  <th className="p-3.5">Nombre & Descripción</th>
                  <th className="p-3.5">Periodicidad</th>
                  <th className="p-3.5">Rango de Fechas (Inicio &rarr; Fin)</th>
                  <th className="p-3.5">Fecha de Pago</th>
                  <th className="p-3.5 text-center">Estatus</th>
                  <th className="p-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {periods.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="p-3.5 font-mono text-etiserv-blue font-bold text-sm">
                      {p.code}
                    </td>
                    <td className="p-3.5">
                      <span className="font-semibold text-slate-900 dark:text-white block">
                        {p.name}
                      </span>
                      {p.notes && <span className="text-[10px] text-slate-400">{p.notes}</span>}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 font-semibold text-[10px]">
                        {p.periodType === "WEEKLY" ? "Semanal" : "Quincenal"}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300">
                      {p.startDate} &rarr; {p.endDate}
                    </td>
                    <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300 font-bold">
                      {p.paymentDate}
                    </td>
                    <td className="p-3.5 text-center">
                      {p.status === "PAID" && <Badge variant="success">Pagado & Cerrado</Badge>}
                      {p.status === "OPEN" && <Badge variant="primary">Abierto (Activo)</Badge>}
                      {p.status === "PROCESSING" && <Badge variant="warning">En Proceso</Badge>}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditPeriod(p)}
                          className="text-[11px] py-1 px-2.5 gap-1 font-semibold"
                        >
                          <Edit2 className="w-3 h-3" /> Editar
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setSelectedRunPeriod(p.code);
                            setActiveTab("RUNS");
                          }}
                          className="text-[11px] py-1 px-2.5 gap-1 font-semibold"
                        >
                          <Receipt className="w-3 h-3" /> Ver Planilla
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 3: ANTICIPOS Y PRÉSTAMOS DE SUELDO                                */}
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
                <span className="text-[11px] text-slate-400 font-medium">Anticipos Registrados</span>
                <h4 className="text-xl font-heading font-bold text-slate-900 dark:text-white font-mono">
                  {advances.length}
                </h4>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-medium">Anticipos Autorizados / Desembolsados</span>
                <h4 className="text-xl font-heading font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatCurrency(totalAuthorizedAdvances)}
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

          {/* Action & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#071C33] p-3 rounded-xl border border-slate-200 dark:border-white/10 shadow-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={advStatusFilter}
                onChange={(e) => setAdvStatusFilter(e.target.value)}
                className="text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071C33] p-2 text-slate-900 dark:text-white"
              >
                <option value="ALL">Todos los Estatus</option>
                <option value="PENDING">🟡 Solicitados / Pendientes</option>
                <option value="AUTHORIZED">🟢 Autorizados & Desembolsados</option>
                <option value="DEDUCTED">🔵 Deducidos en Nómina</option>
                <option value="REJECTED">🔴 Rechazados</option>
              </select>

              <select
                value={advPeriodFilter}
                onChange={(e) => setAdvPeriodFilter(e.target.value)}
                className="text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071C33] p-2 text-slate-900 dark:text-white font-mono"
              >
                <option value="ALL">Todos los Periodos</option>
                {periods.map((p) => (
                  <option key={p.id} value={p.code}>
                    {p.code} - {p.name}
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenNewAdvance()}
              className="w-full sm:w-auto gap-1.5 text-xs font-semibold"
              glow
            >
              <Coins className="w-3.5 h-3.5" /> Registrar Solicitud de Anticipo
            </Button>
          </div>

          {/* Advances Table */}
          <div className="bg-white dark:bg-[#071C33] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-white/[0.02] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/10 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Folio / Asiento</th>
                  <th className="p-3.5">Colaborador</th>
                  <th className="p-3.5">Periodo Aplicable</th>
                  <th className="p-3.5">Fecha</th>
                  <th className="p-3.5">Medio de Pago</th>
                  <th className="p-3.5 text-right">Monto Anticipo</th>
                  <th className="p-3.5 text-center">Estatus & Control</th>
                  <th className="p-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {advances
                  .filter((a) => {
                    if (advStatusFilter !== "ALL" && a.status !== advStatusFilter) return false;
                    if (advPeriodFilter !== "ALL" && a.periodCode !== advPeriodFilter) return false;
                    return true;
                  })
                  .map((adv) => {
                    const isAuthorized = adv.status === "AUTHORIZED";
                    const isDeducted = adv.status === "DEDUCTED";
                    const isPending = adv.status === "PENDING";
                    const isRejected = adv.status === "REJECTED";

                    return (
                      <tr key={adv.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="p-3.5 font-mono text-etiserv-blue font-bold">
                          ADV-#{adv.id}
                          {adv.moveId && (
                            <span className="text-[10px] text-slate-400 block font-normal">
                              Póliza MOVE #{adv.moveId}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className="font-semibold text-slate-900 dark:text-white block">
                            {adv.employeeName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {adv.employeeCode || `EMP-${adv.employeeId}`}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300 font-bold">
                          {adv.periodCode || "2026-09-Q1"}
                        </td>
                        <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300">
                          {adv.date}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={clsx(
                              "px-2 py-0.5 rounded text-[10px] font-bold",
                              adv.paymentMethod === "CASH"
                                ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300"
                                : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"
                            )}
                          >
                            {adv.paymentMethod === "CASH" ? "Caja Chica (101.01)" : "Banco / SPEI (102.01)"}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-bold font-mono text-rose-600 dark:text-rose-400 text-sm">
                          -{formatCurrency(Number(adv.amount))}
                        </td>
                        <td className="p-3.5 text-center">
                          {isPending && (
                            <Badge variant="warning" dot>
                              🟡 Solicitado (Pendiente)
                            </Badge>
                          )}
                          {isAuthorized && (
                            <div className="inline-flex items-center gap-1">
                              <Badge variant="success" dot>
                                🟢 Autorizado
                              </Badge>
                              <span title="Anticipo Autorizado: Inmutable por control contable" className="text-slate-400 cursor-help">
                                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                              </span>
                            </div>
                          )}
                          {isDeducted && (
                            <Badge variant="info" dot>
                              🔵 Deducido en Nómina
                            </Badge>
                          )}
                          {isRejected && (
                            <Badge variant="danger" dot>
                              🔴 Rechazado
                            </Badge>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Botón Autorizar (solo para pendientes) */}
                            {isPending && (
                              <button
                                type="button"
                                onClick={() => handleOpenAuthorizeModal(adv)}
                                className="text-[11px] font-semibold text-emerald-600 hover:underline inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-800/40"
                                title="Autorizar y desembolsar contablemente"
                              >
                                <CheckCircle2 className="w-3 h-3" /> Autorizar
                              </button>
                            )}

                            {/* Botón Editar: HABILITADO si es Pendiente, BLOQUEADO si es Autorizado */}
                            {isPending ? (
                              <button
                                type="button"
                                onClick={() => handleOpenEditAdvance(adv)}
                                className="text-[11px] font-semibold text-slate-600 hover:text-etiserv-blue inline-flex items-center gap-1 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded border border-slate-200 dark:border-white/10"
                                title="Editar solicitud de anticipo"
                              >
                                <Edit2 className="w-3 h-3" /> Editar
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled
                                className="text-[11px] font-semibold text-slate-400 inline-flex items-center gap-1 bg-slate-50 dark:bg-white/[0.02] px-2 py-1 rounded border border-slate-200/50 dark:border-white/5 cursor-not-allowed opacity-60"
                                title="Anticipo Autorizado: Inmutable por control contable"
                              >
                                <Lock className="w-3 h-3" /> Bloqueado
                              </button>
                            )}

                            {/* Botón Rechazar (solo si está pendiente) */}
                            {isPending && (
                              <button
                                type="button"
                                onClick={() => handleRejectAdvance(adv)}
                                className="text-[11px] font-semibold text-rose-600 hover:underline inline-flex items-center gap-1 bg-rose-50 dark:bg-rose-950/40 px-2 py-1 rounded border border-rose-200 dark:border-rose-800/40"
                                title="Rechazar solicitud"
                              >
                                <XCircle className="w-3 h-3" /> Rechazar
                              </button>
                            )}

                            {/* Botón Ver Vale */}
                            <button
                              type="button"
                              onClick={() => {
                                const voucher: AdvanceVoucherData = {
                                  voucherNumber: `ADV-${String(adv.id).padStart(5, "0")}`,
                                  companyName: activeCompany?.name || "Distribuidora Nacional PyME S.A.",
                                  companyTaxId: activeCompany?.taxId || "DNP190820KX1",
                                  date: adv.date,
                                  employeeName: adv.employeeName,
                                  employeeTaxId: "XAXX010101000",
                                  employeeCode: adv.employeeCode || `EMP-${adv.employeeId}`,
                                  jobTitle: "Colaborador",
                                  amount: Number(adv.amount),
                                  paymentMethod: adv.paymentMethod,
                                  notes: adv.notes || "Anticipo de sueldo",
                                };
                                setAdvVoucherData(voucher);
                                setAdvVoucherModalOpen(true);
                              }}
                              className="text-[11px] font-semibold text-amber-600 hover:underline inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded border border-amber-200 dark:border-amber-800/40"
                              title="Ver e imprimir vale de anticipo con firmas"
                            >
                              <Eye className="w-3 h-3" /> Vale
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 4: PLANILLA, PRE-NÓMINA & DISPERSIÓN DINÁMICA                     */}
      {/* ========================================================================= */}
      {activeTab === "RUNS" && (
        <div className="space-y-5 animate-fade-in">
          {/* Period Selector & Summary Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/80 via-slate-50 to-emerald-50/40 dark:from-blue-950/30 dark:via-[#071C33] dark:to-emerald-950/20 border border-blue-200/80 dark:border-white/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Seleccionar Periodo a Dispersar:
                </label>
                <select
                  value={selectedRunPeriod}
                  onChange={(e) => setSelectedRunPeriod(e.target.value)}
                  className="text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-[#071C33] p-1.5 text-etiserv-blue shadow-xs"
                >
                  {periods.map((p) => (
                    <option key={p.id} value={p.code}>
                      {p.code} • {p.name} ({p.status === "PAID" ? "PAGADO" : "ABIERTO"})
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                La tabla calcula automáticamente el sueldo base y deduce los anticipos autorizados pendientes del colaborador.
              </p>
            </div>

            {/* Metrics Ribbon */}
            <div className="flex items-center gap-3 font-mono">
              <div className="text-right p-2.5 bg-white dark:bg-[#06172A] rounded-xl border border-slate-200/80 dark:border-white/10">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Bruto</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {formatCurrency(previewGrossTotal)}
                </span>
              </div>
              <div className="text-right p-2.5 bg-white dark:bg-[#06172A] rounded-xl border border-slate-200/80 dark:border-white/10">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Anticipos Deducidos</span>
                <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                  -{formatCurrency(previewAdvTotal)}
                </span>
              </div>
              <div className="text-right p-2.5 bg-white dark:bg-[#06172A] rounded-xl border border-slate-200/80 dark:border-white/10">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Neto a Dispersar</span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(previewNetTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Pre-Payroll Table */}
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-etiserv-blue" />
                <span>Grilla Interactiva de Pre-Nómina ({payrollPreviewItems.length} Colaboradores)</span>
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">
                Puedes ajustar bonos, horas extras y deducciones directamente en cada fila
              </span>
            </div>

            {previewLoading ? (
              <div className="p-12 text-center text-xs text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-etiserv-blue" />
                <span>Calculando partidas de nómina y anticipos...</span>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-white/10">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-white/[0.02] border-b border-slate-200/80 dark:border-white/10 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="p-3">Empleado</th>
                      <th className="p-3 text-right">Sueldo Base</th>
                      <th className="p-3 text-right text-emerald-600">Bonos (+)</th>
                      <th className="p-3 text-right text-blue-600">Horas Extra (+)</th>
                      <th className="p-3 text-right">ISR Est. (-)</th>
                      <th className="p-3 text-right">IMSS Est. (-)</th>
                      <th className="p-3 text-right bg-rose-50/40 dark:bg-rose-950/20 text-rose-600 font-bold">
                        Anticipos (-)
                      </th>
                      <th className="p-3 text-right bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 font-bold">
                        Neto a Pagar
                      </th>
                      <th className="p-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {payrollPreviewItems.map((item, idx) => (
                      <tr key={item.employeeId || idx} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="p-3">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {item.employeeName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.jobTitle} • {item.employeeCode}
                          </span>
                        </td>

                        <td className="p-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                          {formatCurrency(Number(item.baseSalary))}
                        </td>

                        <td className="p-3 text-right">
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={item.bonus || 0}
                            onChange={(e) =>
                              handleUpdatePreviewItem(idx, "bonus", parseFloat(e.target.value) || 0)
                            }
                            className="w-20 px-2 py-1 text-xs text-right font-mono rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071C33] text-emerald-600 font-bold"
                          />
                        </td>

                        <td className="p-3 text-right">
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={item.overtime || 0}
                            onChange={(e) =>
                              handleUpdatePreviewItem(idx, "overtime", parseFloat(e.target.value) || 0)
                            }
                            className="w-20 px-2 py-1 text-xs text-right font-mono rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071C33] text-blue-600 font-bold"
                          />
                        </td>

                        <td className="p-3 text-right font-mono text-slate-500">
                          -{formatCurrency(Number(item.taxDeduction || 0))}
                        </td>

                        <td className="p-3 text-right font-mono text-slate-500">
                          -{formatCurrency(Number(item.imssDeduction || 0))}
                        </td>

                        <td className="p-3 text-right bg-rose-50/30 dark:bg-rose-950/10">
                          <span className="font-mono font-bold text-rose-600 block">
                            -{formatCurrency(Number(item.advanceDeduction || 0))}
                          </span>
                          {item.advanceIds?.length > 0 && (
                            <span className="text-[9px] text-slate-400 font-mono block">
                              {item.advanceIds.length} anticipo(s)
                            </span>
                          )}
                        </td>

                        <td className="p-3 text-right bg-emerald-50/40 dark:bg-emerald-950/20 font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(Number(item.netPaid))}
                        </td>

                        <td className="p-3 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenReceiptForEmployee(item)}
                            className="text-[11px] py-1 px-2 font-semibold text-etiserv-blue"
                            title="Ver recibo individual proyectado"
                          >
                            <FileText className="w-3 h-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALES                                                                   */}
      {/* ========================================================================= */}

      {/* Modal 1: Alta / Edición de Empleado */}
      <Modal
        isOpen={empModalOpen}
        onClose={() => setEmpModalOpen(false)}
        title={editingEmpId ? "Editar Datos del Colaborador" : "Alta de Nuevo Empleado"}
        maxWidth="md"
      >
        <form onSubmit={handleSaveEmployee} className="space-y-3.5">
          <Input
            label="Nombre Completo *"
            placeholder="Ej: Carlos Martínez López"
            value={empName}
            onChange={(e) => setEmpName(e.target.value)}
            required
            autoFocus
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Código de Empleado"
              placeholder="EMP-101"
              value={empCode}
              onChange={(e) => setEmpCode(e.target.value)}
            />
            <Input
              label="RFC / CURP / Tax ID *"
              placeholder="MALC900101XYZ"
              value={empTaxId}
              onChange={(e) => setEmpTaxId(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Puesto / Cargo"
              placeholder="Cajero / Vendedor"
              value={empJobTitle}
              onChange={(e) => setEmpJobTitle(e.target.value)}
            />
            <Select
              label="Departamento"
              value={empDepartment}
              onChange={(e) => setEmpDepartment(e.target.value)}
            >
              <option value="Ventas">Ventas & Mostrador</option>
              <option value="Almacén">Almacén & Logística</option>
              <option value="Administración">Administración & Finanzas</option>
              <option value="General">General</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Sueldo Base ($) *"
              type="number"
              step="0.01"
              placeholder="7500.00"
              value={empBaseSalary}
              onChange={(e) => setEmpBaseSalary(e.target.value)}
              required
            />
            <Select
              label="Periodicidad de Pago"
              value={empPaymentPeriod}
              onChange={(e) => setEmpPaymentPeriod(e.target.value as any)}
            >
              <option value="BIWEEKLY">Quincenal (15 días)</option>
              <option value="WEEKLY">Semanal (7 días)</option>
              <option value="MONTHLY">Mensual (30 días)</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Banco de Dispersión"
              placeholder="BBVA Bancomer"
              value={empBankName}
              onChange={(e) => setEmpBankName(e.target.value)}
            />
            <Input
              label="CLABE Interbancaria (18 dígitos)"
              placeholder="012180001234567890"
              value={empClabe}
              onChange={(e) => setEmpClabe(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Teléfono Móvil"
              placeholder="55 1234 5678"
              value={empPhone}
              onChange={(e) => setEmpPhone(e.target.value)}
            />
            <Input
              label="Correo Electrónico"
              placeholder="empleado@empresa.com"
              type="email"
              value={empEmail}
              onChange={(e) => setEmpEmail(e.target.value)}
            />
          </div>

          <div className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
            <Button variant="outline" className="flex-1" type="button" onClick={() => setEmpModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" glow className="flex-1" type="submit" loading={empSaving}>
              Guardar Colaborador
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Crear / Editar Periodo de Nómina */}
      <Modal
        isOpen={periodModalOpen}
        onClose={() => setPeriodModalOpen(false)}
        title={editingPeriodId ? "Editar Periodo de Nómina" : "Nuevo Periodo de Nómina"}
        maxWidth="md"
      >
        <form onSubmit={handleSavePeriod} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Código de Periodo *"
              placeholder="2026-10-Q1"
              value={periodCode}
              onChange={(e) => setPeriodCode(e.target.value)}
              required
            />
            <Select
              label="Periodicidad"
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value as any)}
            >
              <option value="BIWEEKLY">Quincenal (15 días)</option>
              <option value="WEEKLY">Semanal (7 días)</option>
              <option value="MONTHLY">Mensual (30 días)</option>
            </Select>
          </div>

          <Input
            label="Nombre del Periodo *"
            placeholder="1ra Quincena de Octubre 2026"
            value={periodName}
            onChange={(e) => setPeriodName(e.target.value)}
            required
          />

          <div className="grid grid-cols-3 gap-2.5">
            <Input
              label="Fecha Inicio *"
              type="date"
              value={periodStartDate}
              onChange={(e) => setPeriodStartDate(e.target.value)}
              required
            />
            <Input
              label="Fecha Fin *"
              type="date"
              value={periodEndDate}
              onChange={(e) => setPeriodEndDate(e.target.value)}
              required
            />
            <Input
              label="Fecha de Pago *"
              type="date"
              value={periodPaymentDate}
              onChange={(e) => setPeriodPaymentDate(e.target.value)}
              required
            />
          </div>

          <Input
            label="Notas u Observaciones"
            placeholder="Observaciones del periodo"
            value={periodNotes}
            onChange={(e) => setPeriodNotes(e.target.value)}
          />

          <div className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
            <Button variant="outline" className="flex-1" type="button" onClick={() => setPeriodModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" glow className="flex-1" type="submit" loading={periodSaving}>
              Guardar Periodo
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Solicitud / Edición de Anticipo */}
      <Modal
        isOpen={advModalOpen}
        onClose={() => setAdvModalOpen(false)}
        title={editingAdvId ? "Editar Solicitud de Anticipo" : "Registrar Solicitud de Anticipo"}
        maxWidth="md"
      >
        <form onSubmit={handleSaveAdvance} className="space-y-3.5">
          <Autocomplete
            label="Colaborador Solicitante *"
            placeholder="Selecciona o busca un colaborador..."
            searchPlaceholder="Escribe nombre, puesto o código..."
            items={employees
              .filter((e) => e.status === "ACTIVE")
              .map((emp) => ({
                id: emp.id,
                title: emp.name,
                subtitle: `${emp.jobTitle} • Base: ${formatCurrency(emp.baseSalary)}`,
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
            />
            <Select
              label="Periodo a Deducir"
              value={advPeriodCode}
              onChange={(e) => setAdvPeriodCode(e.target.value)}
            >
              {periods.map((p) => (
                <option key={p.id} value={p.code}>
                  {p.code} - {p.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Medio de Entrega Previsto"
              value={advPaymentMethod}
              onChange={(e) => setAdvPaymentMethod(e.target.value as any)}
            >
              <option value="CASH">Efectivo (Caja Chica 101.01)</option>
              <option value="BANK">Transferencia / Banco (102.01)</option>
            </Select>
            <Input
              label="Fecha de Solicitud"
              type="date"
              value={advDate}
              onChange={(e) => setAdvDate(e.target.value)}
            />
          </div>

          <Input
            label="Motivo o Justificación"
            placeholder="Ej: Anticipo por gastos médicos"
            value={advNotes}
            onChange={(e) => setAdvNotes(e.target.value)}
          />

          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300">
            <strong>Control Interno:</strong> Al registrarse, el anticipo quedará en estado <em>Pendiente</em>. Al ser <strong>Autorizado</strong>, se generará la póliza contable y ya <strong>no podrá modificarse</strong>.
          </div>

          <div className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
            <Button variant="outline" className="flex-1" type="button" onClick={() => setAdvModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" glow className="flex-1" type="submit" loading={advSaving}>
              Guardar Anticipo
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 4: Autorización Contable de Anticipo */}
      <Modal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        title="Autorizar y Desembolsar Anticipo"
        maxWidth="md"
      >
        {authorizingAdv && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Colaborador:</span>
                <strong className="text-slate-900 dark:text-white font-bold">{authorizingAdv.employeeName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Monto a Desembolsar:</span>
                <strong className="text-rose-600 font-mono font-bold text-sm">
                  {formatCurrency(Number(authorizingAdv.amount))}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Periodo de Deducción:</span>
                <span className="font-mono font-bold text-etiserv-blue">{authorizingAdv.periodCode || "2026-09-Q1"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Motivo:</span>
                <span className="text-slate-700 dark:text-slate-300">{authorizingAdv.notes || "Anticipo de sueldo"}</span>
              </div>
            </div>

            <div>
              <Select
                label="Cuenta de Desembolso de Tesorería"
                value={authPaymentMethod}
                onChange={(e) => setAuthPaymentMethod(e.target.value as any)}
              >
                <option value="CASH">Caja Chica (Cuenta 101.01) - Efectivo</option>
                <option value="BANK">Banco / Cuenta Operativa (Cuenta 102.01) - Transferencia</option>
              </Select>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <Lock className="w-3.5 h-3.5" />
                <span>Efecto Contable & Bloqueo de Inmutabilidad:</span>
              </div>
              <p>
                Se registrará la póliza de diario con cargo a <code>107.01 (Anticipos a Personal)</code> y abono a tesorería. <strong>Una vez autorizado, el anticipo quedará bloqueado e inmutable</strong>.
              </p>
            </div>

            <div className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
              <Button variant="outline" className="flex-1" onClick={() => setAuthModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="success"
                glow
                className="flex-1"
                onClick={handleConfirmAuthorizeAdvance}
                loading={authLoading}
              >
                Confirmar Autorización
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal 5: Confirmar Dispersión Bancaria */}
      <Modal
        isOpen={runConfirmModalOpen}
        onClose={() => setRunConfirmModalOpen(false)}
        title={`Confirmar Dispersión de Nómina • ${selectedRunPeriod}`}
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Colaboradores a Dispersar:</span>
              <strong className="text-slate-900 dark:text-white font-mono">{payrollPreviewItems.length}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Percepciones Brutas:</span>
              <strong className="text-slate-900 dark:text-white font-mono">{formatCurrency(previewGrossTotal)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Retenciones Fiscales (ISR/IMSS):</span>
              <span className="text-slate-600 dark:text-slate-400 font-mono">-{formatCurrency(previewTaxTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Anticipos Amortizados:</span>
              <strong className="text-rose-600 font-mono">-{formatCurrency(previewAdvTotal)}</strong>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-white/10 text-sm font-bold">
              <span className="text-slate-900 dark:text-white">Neto Total a Transferir:</span>
              <strong className="text-emerald-600 font-mono">{formatCurrency(previewNetTotal)}</strong>
            </div>
          </div>

          <div>
            <Select
              label="Cuenta de Egreso Bancario"
              value={runPaymentMethod}
              onChange={(e) => setRunPaymentMethod(e.target.value as any)}
            >
              <option value="BANK">Banco Principal (Cuenta 102.01) - Dispersión SPEI</option>
              <option value="CASH">Caja de Efectivo (Cuenta 101.01)</option>
            </Select>
          </div>

          <Input
            label="Notas de la Póliza"
            value={runNotes}
            onChange={(e) => setRunNotes(e.target.value)}
          />

          <div className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
            <Button variant="outline" className="flex-1" onClick={() => setRunConfirmModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="success"
              glow
              className="flex-1"
              onClick={handleConfirmRunPayroll}
              loading={runLoading}
            >
              Dispersar y Cerrar Periodo
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

export default PayrollView;
