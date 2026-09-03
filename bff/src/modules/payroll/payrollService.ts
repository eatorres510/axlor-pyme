import { axelor } from "../../services/axelor/axelorClient.js";
import { expensesService } from "../expenses/expensesService.js";
import {
  EmployeeInput,
  UpdateEmployeeInput,
  PayrollPeriodInput,
  UpdatePayrollPeriodInput,
  AdvanceInput,
  UpdateAdvanceInput,
  AuthorizeAdvanceInput,
  PayrollRunInput,
} from "./payrollTypes.js";
import { SEED_EMPLOYEES } from "../../data/masterRelationalSeed.js";

export const CUSTOM_EMPLOYEES: any[] = [];

export interface PayrollPeriodRecord {
  id: number;
  companyId: number;
  code: string;
  name: string;
  periodType: "WEEKLY" | "BIWEEKLY" | "MONTHLY";
  startDate: string;
  endDate: string;
  paymentDate: string;
  status: "OPEN" | "PROCESSING" | "PAID" | "CLOSED";
  notes?: string;
  createdAt: string;
}

export interface AdvanceRecord {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  companyId: number;
  periodCode?: string;
  amount: number;
  paymentMethod: "CASH" | "BANK";
  date: string;
  notes?: string;
  status: "PENDING" | "AUTHORIZED" | "DEDUCTED" | "REJECTED";
  authorizedBy?: string;
  authorizedAt?: string;
  moveId?: number;
  deductedInPeriod?: string;
  createdAt: string;
}

// In-Memory state caches with initial pre-populated data for PyME 2026
export const PAYROLL_PERIODS: PayrollPeriodRecord[] = [
  {
    id: 1,
    companyId: 13,
    code: "2026-08-Q1",
    name: "1ra Quincena de Agosto 2026",
    periodType: "BIWEEKLY",
    startDate: "2026-08-01",
    endDate: "2026-08-15",
    paymentDate: "2026-08-15",
    status: "PAID",
    notes: "Nómina regular quincenal",
    createdAt: "2026-08-01T08:00:00Z",
  },
  {
    id: 2,
    companyId: 13,
    code: "2026-08-Q2",
    name: "2da Quincena de Agosto 2026",
    periodType: "BIWEEKLY",
    startDate: "2026-08-16",
    endDate: "2026-08-31",
    paymentDate: "2026-08-31",
    status: "PAID",
    notes: "Cierre mensual de nómina",
    createdAt: "2026-08-16T08:00:00Z",
  },
  {
    id: 3,
    companyId: 13,
    code: "2026-09-Q1",
    name: "1ra Quincena de Septiembre 2026",
    periodType: "BIWEEKLY",
    startDate: "2026-09-01",
    endDate: "2026-09-15",
    paymentDate: "2026-09-15",
    status: "OPEN",
    notes: "Periodo activo en curso",
    createdAt: "2026-09-01T08:00:00Z",
  },
  {
    id: 4,
    companyId: 13,
    code: "2026-09-Q2",
    name: "2da Quincena de Septiembre 2026",
    periodType: "BIWEEKLY",
    startDate: "2026-09-16",
    endDate: "2026-09-30",
    paymentDate: "2026-09-30",
    status: "OPEN",
    notes: "Próxima quincena",
    createdAt: "2026-09-01T08:00:00Z",
  },
];

export const ADVANCES_REGISTRY: AdvanceRecord[] = [
  {
    id: 101,
    employeeId: 1,
    employeeName: "Carlos Martínez López",
    employeeCode: "EMP-101",
    companyId: 13,
    periodCode: "2026-09-Q1",
    amount: 1500,
    paymentMethod: "CASH",
    date: "2026-09-01",
    notes: "Anticipo de sueldo por gastos médicos familiares",
    status: "AUTHORIZED",
    authorizedBy: "Administrador General",
    authorizedAt: "2026-09-01T10:30:00Z",
    moveId: 1204,
    createdAt: "2026-09-01T10:00:00Z",
  },
  {
    id: 102,
    employeeId: 2,
    employeeName: "Ana Gómez Sánchez",
    employeeCode: "EMP-102",
    companyId: 13,
    periodCode: "2026-09-Q1",
    amount: 800,
    paymentMethod: "BANK",
    date: "2026-09-02",
    notes: "Anticipo quincenal de transporte",
    status: "PENDING",
    createdAt: "2026-09-02T11:15:00Z",
  },
];

let nextPeriodId = 5;
let nextAdvanceId = 103;

export class PayrollService {
  // ==========================================
  // 1. EMPLEADOS & COLABORADORES (CRUD)
  // ==========================================

  public async listEmployees(companyId: number): Promise<any[]> {
    try {
      const res = await axelor.search("com.axelor.apps.hr.db.Employee", {
        data: {
          _domain: `self.company.id = ${companyId}`,
        },
        limit: 100,
        sortBy: ["name"],
      });
      const rawList = Array.isArray(res.data) ? res.data : [];
      const combined = [...CUSTOM_EMPLOYEES, ...rawList, ...SEED_EMPLOYEES];

      const seen = new Set<string>();
      const employees: any[] = [];
      for (const e of combined) {
        const key = String(e.id || e.code || e.name || "").trim().toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          employees.push({
            id: e.id || Math.floor(Math.random() * 9000 + 100),
            name: e.name,
            code: e.code || `EMP-${e.id}`,
            taxId: e.taxId || e.taxNbr || "XAXX010101000",
            jobTitle: e.jobTitle || "Colaborador General",
            department: e.department || "General",
            baseSalary: Number(e.baseSalary || 7500.0),
            paymentPeriod: e.paymentPeriod || "BIWEEKLY",
            phone: e.phone || e.fixedPhone || "",
            email: e.email || "",
            bankName: e.bankName || "BBVA Bancomer",
            bankAccount: e.bankAccount || "",
            clabe: e.clabe || "",
            hireDate: e.hireDate || "2024-01-15",
            status: e.status || "ACTIVE",
            companyId: e.company?.id || companyId,
          });
        }
      }
      return employees;
    } catch {
      return [...CUSTOM_EMPLOYEES, ...SEED_EMPLOYEES];
    }
  }

  public async createEmployee(input: EmployeeInput): Promise<any> {
    const code = input.code || `EMP-${Math.floor(100 + Math.random() * 900)}`;

    let partnerId = 1;
    let empId = Math.floor(Math.random() * 9000 + 1000);

    try {
      // 1. Create Partner
      const partnerRes = await axelor.create("com.axelor.apps.base.db.Partner", {
        name: input.name,
        simpleFullName: input.name,
        taxNbr: input.taxId,
        isContact: true,
        isEmployee: true,
        fixedPhone: input.phone || null,
        companySet: [{ id: input.companyId }],
      });
      const partner = Array.isArray(partnerRes.data) ? partnerRes.data[0] : partnerRes.data;
      if (partner?.id) partnerId = partner.id;

      // 2. Create Employee
      const empRes = await axelor.create("com.axelor.apps.hr.db.Employee", {
        name: input.name,
        code: code,
        contactPartner: { id: partnerId },
        company: { id: input.companyId },
        exportCode: code,
      });
      const emp = Array.isArray(empRes.data) ? empRes.data[0] : empRes.data;
      if (emp?.id) empId = emp.id;
    } catch (e: any) {
      console.warn("[PayrollService] Creando empleado en memoria (Axelor fallback):", e.message);
    }

    const newEmp = {
      id: empId,
      name: input.name,
      code,
      taxId: input.taxId,
      jobTitle: input.jobTitle || "Colaborador General",
      department: input.department || "General",
      baseSalary: input.baseSalary,
      paymentPeriod: input.paymentPeriod || "BIWEEKLY",
      companyId: input.companyId,
      partnerId,
      phone: input.phone || "",
      email: input.email || "",
      bankName: input.bankName || "BBVA Bancomer",
      bankAccount: input.bankAccount || "",
      clabe: input.clabe || "",
      hireDate: input.hireDate || new Date().toISOString().slice(0, 10),
      status: input.status || "ACTIVE",
    };

    CUSTOM_EMPLOYEES.unshift(newEmp);
    return newEmp;
  }

  public async updateEmployee(id: number, input: UpdateEmployeeInput): Promise<any> {
    const list = await this.listEmployees(input.companyId || 13);
    const existing = list.find((e) => e.id === id);
    if (!existing) {
      throw new Error(`Empleado con ID ${id} no encontrado.`);
    }

    const updated = {
      ...existing,
      ...input,
      id,
    };

    // Update in CUSTOM_EMPLOYEES or push
    const idx = CUSTOM_EMPLOYEES.findIndex((e) => e.id === id);
    if (idx !== -1) {
      CUSTOM_EMPLOYEES[idx] = updated;
    } else {
      CUSTOM_EMPLOYEES.push(updated);
    }

    try {
      await axelor.update("com.axelor.apps.hr.db.Employee", {
        id,
        name: updated.name,
        code: updated.code,
      });
    } catch {}

    return updated;
  }

  public async toggleEmployeeStatus(id: number, status: "ACTIVE" | "INACTIVE"): Promise<any> {
    return this.updateEmployee(id, { status });
  }

  // ==========================================
  // 2. PERIODOS DE NÓMINA (CRUD)
  // ==========================================

  public async listPayrollPeriods(companyId: number): Promise<PayrollPeriodRecord[]> {
    return PAYROLL_PERIODS.filter((p) => p.companyId === companyId || !p.companyId).sort(
      (a, b) => b.id - a.id
    );
  }

  public async createPayrollPeriod(input: PayrollPeriodInput): Promise<PayrollPeriodRecord> {
    const existing = PAYROLL_PERIODS.find(
      (p) => p.companyId === input.companyId && p.code.toLowerCase() === input.code.toLowerCase()
    );
    if (existing) {
      throw new Error(`El periodo con código [${input.code}] ya existe.`);
    }

    const newPeriod: PayrollPeriodRecord = {
      id: nextPeriodId++,
      companyId: input.companyId,
      code: input.code.toUpperCase(),
      name: input.name,
      periodType: input.periodType || "BIWEEKLY",
      startDate: input.startDate,
      endDate: input.endDate,
      paymentDate: input.paymentDate,
      status: input.status || "OPEN",
      notes: input.notes || "",
      createdAt: new Date().toISOString(),
    };

    PAYROLL_PERIODS.unshift(newPeriod);
    return newPeriod;
  }

  public async updatePayrollPeriod(
    id: number,
    input: UpdatePayrollPeriodInput
  ): Promise<PayrollPeriodRecord> {
    const period = PAYROLL_PERIODS.find((p) => p.id === id);
    if (!period) {
      throw new Error(`Periodo de nómina #${id} no encontrado.`);
    }

    if (period.status === "PAID" && input.status && input.status !== "PAID") {
      throw new Error("No es posible reabrir un periodo de nómina que ya fue pagado y dispersado.");
    }

    if (input.code) period.code = input.code.toUpperCase();
    if (input.name) period.name = input.name;
    if (input.periodType) period.periodType = input.periodType;
    if (input.startDate) period.startDate = input.startDate;
    if (input.endDate) period.endDate = input.endDate;
    if (input.paymentDate) period.paymentDate = input.paymentDate;
    if (input.status) period.status = input.status;
    if (input.notes !== undefined) period.notes = input.notes;

    return period;
  }

  // ==========================================
  // 3. ANTICIPOS DE SUELDO & REGLA DE INMUTABILIDAD
  // ==========================================

  public async listAdvances(
    companyId: number,
    filters?: { employeeId?: number; status?: string; periodCode?: string }
  ): Promise<AdvanceRecord[]> {
    let list = ADVANCES_REGISTRY.filter((a) => a.companyId === companyId || !a.companyId);

    if (filters?.employeeId) {
      list = list.filter((a) => a.employeeId === filters.employeeId);
    }
    if (filters?.status && filters.status !== "ALL") {
      list = list.filter((a) => a.status === filters.status);
    }
    if (filters?.periodCode && filters.periodCode !== "ALL") {
      list = list.filter((a) => a.periodCode === filters.periodCode);
    }

    return list.sort((a, b) => b.id - a.id);
  }

  public async createAdvance(input: AdvanceInput): Promise<AdvanceRecord> {
    const today = input.date || new Date().toISOString().slice(0, 10);
    const employees = await this.listEmployees(input.companyId);
    const emp = employees.find((e) => e.id === input.employeeId);

    const empName = emp?.name || `Empleado #${input.employeeId}`;
    const empCode = emp?.code || `EMP-${input.employeeId}`;

    const newAdv: AdvanceRecord = {
      id: nextAdvanceId++,
      employeeId: input.employeeId,
      employeeName: empName,
      employeeCode: empCode,
      companyId: input.companyId,
      periodCode: input.periodCode || "2026-09-Q1",
      amount: Number(input.amount.toFixed(2)),
      paymentMethod: input.paymentMethod || "CASH",
      date: today,
      notes: input.notes || "Solicitud de anticipo de sueldo",
      status: "PENDING", // Initial state: PENDING
      createdAt: new Date().toISOString(),
    };

    ADVANCES_REGISTRY.unshift(newAdv);
    return newAdv;
  }

  public async updateAdvance(id: number, input: UpdateAdvanceInput): Promise<AdvanceRecord> {
    const adv = ADVANCES_REGISTRY.find((a) => a.id === id);
    if (!adv) {
      throw new Error(`Anticipo #${id} no encontrado.`);
    }

    // =========================================================================
    // REGLA CRÍTICA DE CONTROL INTERNO: UN ANTICIPO AUTORIZADO ES INMUTABLE
    // =========================================================================
    if (adv.status === "AUTHORIZED") {
      throw new Error(
        "❌ BLOQUEO DE CONTROL INTERNO: Este anticipo ya fue AUTORIZADO y desembolsado contablemente. " +
          "Por integridad financiera, un anticipo autorizado es INMUTABLE y no puede ser modificado."
      );
    }

    if (adv.status === "DEDUCTED") {
      throw new Error(
        "❌ Este anticipo ya fue DEDUCIDO y liquidado en una nómina procesada. No es posible modificarlo."
      );
    }

    if (input.amount !== undefined) adv.amount = Number(input.amount.toFixed(2));
    if (input.paymentMethod !== undefined) adv.paymentMethod = input.paymentMethod;
    if (input.date !== undefined) adv.date = input.date;
    if (input.notes !== undefined) adv.notes = input.notes;
    if (input.periodCode !== undefined) adv.periodCode = input.periodCode;

    return adv;
  }

  public async authorizeAdvance(
    id: number,
    input: AuthorizeAdvanceInput
  ): Promise<AdvanceRecord> {
    const adv = ADVANCES_REGISTRY.find((a) => a.id === id);
    if (!adv) {
      throw new Error(`Anticipo #${id} no encontrado.`);
    }

    if (adv.status === "AUTHORIZED") {
      return adv; // Already authorized
    }
    if (adv.status === "DEDUCTED") {
      throw new Error("El anticipo ya fue deducido en nómina.");
    }

    const today = new Date().toISOString().slice(0, 10);
    const isCash = (input.paymentMethod || adv.paymentMethod) === "CASH";

    let moveId = Math.floor(Math.random() * 9000 + 1000);

    try {
      // 1. Resolve Accounting Accounts & Period in Axelor
      const periodId = await expensesService.ensureAccountingPeriod(input.companyId, today);
      const advanceAccountId = await expensesService.resolveAccount(input.companyId, "107"); // 107.01 Anticipos a Personal
      const paymentAccountId = await expensesService.resolveAccount(
        input.companyId,
        isCash ? "101" : "102"
      );
      const journalId = await expensesService.resolveJournal(input.companyId, isCash);

      // 2. Post Accounting Move to Axelor
      const movePayload = {
        company: { id: input.companyId },
        journal: { id: journalId },
        period: { id: periodId },
        date: today,
        statusSelect: 1,
        origin: `Anticipo Empleado: [${adv.employeeName}] $${adv.amount} (${adv.periodCode || "Q1"})`,
        lineList: [
          {
            account: { id: advanceAccountId },
            debit: adv.amount,
            credit: 0.0,
            name: `Anticipo a ${adv.employeeName}`,
          },
          {
            account: { id: paymentAccountId },
            debit: 0.0,
            credit: adv.amount,
            name: `Desembolso ${isCash ? "Efectivo" : "Banco"} Anticipo`,
          },
        ],
      };

      const res = await axelor.create("com.axelor.apps.account.db.Move", movePayload);
      const moveItem = Array.isArray(res.data) ? res.data[0] : res.data;
      if (moveItem?.id) moveId = moveItem.id;
    } catch (e: any) {
      console.warn("[PayrollService] Póliza contable registrada con ID simulado:", e.message);
    }

    adv.status = "AUTHORIZED";
    adv.paymentMethod = input.paymentMethod || adv.paymentMethod;
    adv.authorizedBy = input.authorizedBy || "Administrador General";
    adv.authorizedAt = new Date().toISOString();
    adv.moveId = moveId;

    return adv;
  }

  public async rejectAdvance(id: number, reason?: string): Promise<AdvanceRecord> {
    const adv = ADVANCES_REGISTRY.find((a) => a.id === id);
    if (!adv) {
      throw new Error(`Anticipo #${id} no encontrado.`);
    }

    if (adv.status === "AUTHORIZED") {
      throw new Error(
        "No es posible rechazar un anticipo que ya fue autorizado y desembolsado en tesorería."
      );
    }

    adv.status = "REJECTED";
    if (reason) adv.notes = `${adv.notes || ""} [Rechazado: ${reason}]`;
    return adv;
  }

  // ==========================================
  // 4. PRE-NÓMINA & DISPERSIÓN DINÁMICA
  // ==========================================

  public async getPayrollPreview(
    companyId: number,
    periodCode: string
  ): Promise<{
    periodCode: string;
    periodName: string;
    totalEmployees: number;
    totalGross: number;
    totalTax: number;
    totalImss: number;
    totalAdvances: number;
    totalNet: number;
    items: any[];
  }> {
    const employees = await this.listEmployees(companyId);
    const activeEmployees = employees.filter((e) => e.status !== "INACTIVE");

    // Get authorized advances that have NOT been deducted yet
    const authorizedAdvances = ADVANCES_REGISTRY.filter(
      (a) =>
        (a.companyId === companyId || !a.companyId) &&
        a.status === "AUTHORIZED" &&
        (!a.periodCode || a.periodCode === periodCode)
    );

    let totalGross = 0;
    let totalTax = 0;
    let totalImss = 0;
    let totalAdvances = 0;
    let totalNet = 0;

    const items = activeEmployees.map((emp) => {
      const baseSalary = Number(emp.baseSalary || 7500.0);
      const bonus = 0;
      const overtime = 0;
      const gross = Number((baseSalary + bonus + overtime).toFixed(2));

      // Standard Mexico Tax & IMSS Projections
      const taxDeduction = Number((gross * 0.08).toFixed(2)); // ISR ~8%
      const imssDeduction = Number((gross * 0.025).toFixed(2)); // IMSS ~2.5%
      const otherDeductions = 0;

      // Match authorized advances for this employee
      const empAdvs = authorizedAdvances.filter((a) => a.employeeId === emp.id);
      const advanceDeduction = Number(
        empAdvs.reduce((sum, a) => sum + Number(a.amount || 0), 0).toFixed(2)
      );
      const advanceIds = empAdvs.map((a) => a.id);

      const totalDeductions = Number(
        (taxDeduction + imssDeduction + otherDeductions + advanceDeduction).toFixed(2)
      );
      const netPaid = Number(Math.max(0, gross - totalDeductions).toFixed(2));

      totalGross += gross;
      totalTax += taxDeduction;
      totalImss += imssDeduction;
      totalAdvances += advanceDeduction;
      totalNet += netPaid;

      return {
        employeeId: emp.id,
        employeeName: emp.name,
        employeeCode: emp.code,
        jobTitle: emp.jobTitle || "Colaborador General",
        department: emp.department || "General",
        paymentPeriod: emp.paymentPeriod || "BIWEEKLY",
        bankName: emp.bankName || "BBVA",
        clabe: emp.clabe || "",
        baseSalary,
        bonus,
        overtime,
        gross,
        taxDeduction,
        imssDeduction,
        otherDeductions,
        advanceDeduction,
        advanceIds,
        netPaid,
        notes: empAdvs.length > 0 ? `Incluye deducción de ${empAdvs.length} anticipo(s)` : "",
      };
    });

    const periodObj = PAYROLL_PERIODS.find((p) => p.code === periodCode);

    return {
      periodCode,
      periodName: periodObj?.name || `Periodo ${periodCode}`,
      totalEmployees: activeEmployees.length,
      totalGross: Number(totalGross.toFixed(2)),
      totalTax: Number(totalTax.toFixed(2)),
      totalImss: Number(totalImss.toFixed(2)),
      totalAdvances: Number(totalAdvances.toFixed(2)),
      totalNet: Number(totalNet.toFixed(2)),
      items,
    };
  }

  public async runPayroll(input: PayrollRunInput): Promise<{
    success: boolean;
    period: string;
    employeeCount: number;
    totalGross: number;
    totalAdvancesDeducted: number;
    totalTaxDeducted: number;
    totalNetPaid: number;
    moveId: number;
    timestamp: string;
  }> {
    const today = new Date().toISOString().slice(0, 10);
    const isCash = input.paymentMethod === "CASH";

    let totalGross = 0;
    let totalAdvances = 0;
    let totalTax = 0;
    let totalNet = 0;

    const allDeductedAdvIds: number[] = [];

    for (const item of input.items) {
      const gross = Number(
        (item.baseSalary + (item.bonus || 0) + (item.overtime || 0)).toFixed(2)
      );
      const tax = Number(
        ((item.taxDeduction || 0) + (item.imssDeduction || 0) + (item.otherDeductions || 0)).toFixed(2)
      );
      const adv = Number((item.advanceDeduction || 0).toFixed(2));
      const net = Number((gross - tax - adv).toFixed(2));

      totalGross += gross;
      totalTax += tax;
      totalAdvances += adv;
      totalNet += net;

      if (Array.isArray(item.advanceIds)) {
        allDeductedAdvIds.push(...item.advanceIds);
      }
    }

    totalGross = Number(totalGross.toFixed(2));
    totalAdvances = Number(totalAdvances.toFixed(2));
    totalTax = Number(totalTax.toFixed(2));
    totalNet = Number(totalNet.toFixed(2));

    let moveId = Math.floor(Math.random() * 9000 + 2000);

    try {
      // 1. Resolve Accounting Entities in Axelor
      const periodId = await expensesService.ensureAccountingPeriod(input.companyId, today);
      const salaryAccountId = await expensesService.resolveAccount(input.companyId, "602"); // 602.01 Sueldos y Salarios
      const advanceAccountId = await expensesService.resolveAccount(input.companyId, "107"); // 107.01 Anticipos a Personal
      const taxLiabilityAccount = await expensesService.resolveAccount(input.companyId, "205"); // Retenciones ISR/IMSS
      const paymentAccountId = await expensesService.resolveAccount(
        input.companyId,
        isCash ? "101" : "102"
      );
      const journalId = await expensesService.resolveJournal(input.companyId, isCash);

      // 2. Build Balanced Accounting Move Lines
      const lines = [
        {
          account: { id: salaryAccountId },
          debit: totalGross,
          credit: 0.0,
          name: `Nómina Periodo ${input.period} - Sueldos Devengados`,
        },
      ];

      if (totalAdvances > 0) {
        lines.push({
          account: { id: advanceAccountId },
          debit: 0.0,
          credit: totalAdvances,
          name: `Amortización de Anticipos Periodo ${input.period}`,
        });
      }

      if (totalTax > 0) {
        lines.push({
          account: { id: taxLiabilityAccount },
          debit: 0.0,
          credit: totalTax,
          name: `Retenciones de Nómina (ISR / IMSS) Periodo ${input.period}`,
        });
      }

      lines.push({
        account: { id: paymentAccountId },
        debit: 0.0,
        credit: totalNet,
        name: `Dispersión Neta Nómina ${input.paymentMethod} ${input.period}`,
      });

      // 3. Create Balanced Accounting Move (Asiento 602.01 vs 107.01 & 102.01)
      const movePayload = {
        company: { id: input.companyId },
        journal: { id: journalId },
        period: { id: periodId },
        date: today,
        statusSelect: 1,
        origin: `Nómina Express: [${input.period}] Empleados: ${input.items.length}`,
        lineList: lines,
      };

      const res = await axelor.create("com.axelor.apps.account.db.Move", movePayload);
      const moveItem = Array.isArray(res.data) ? res.data[0] : res.data;
      if (moveItem?.id) moveId = moveItem.id;
    } catch (e: any) {
      console.warn("[PayrollService] Asiento contable de nómina simulado:", e.message);
    }

    // 4. Update Advances to DEDUCTED state
    for (const advId of allDeductedAdvIds) {
      const adv = ADVANCES_REGISTRY.find((a) => a.id === advId);
      if (adv) {
        adv.status = "DEDUCTED";
        adv.deductedInPeriod = input.period;
      }
    }

    // 5. Update Payroll Period to PAID
    const periodObj = PAYROLL_PERIODS.find((p) => p.code === input.period);
    if (periodObj) {
      periodObj.status = "PAID";
    }

    return {
      success: true,
      period: input.period,
      employeeCount: input.items.length,
      totalGross,
      totalAdvancesDeducted: totalAdvances,
      totalTaxDeducted: totalTax,
      totalNetPaid: totalNet,
      moveId,
      timestamp: new Date().toISOString(),
    };
  }

  public async listPayrollRuns(companyId: number): Promise<any[]> {
    try {
      const res = await axelor.search("com.axelor.apps.account.db.Move", {
        data: {
          _domain: `self.company.id = ${companyId} and self.origin like 'Nómina Express:%'`,
        },
        limit: 50,
        sortBy: ["-createdOn"],
      });
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  }
}

export const payrollService = new PayrollService();

