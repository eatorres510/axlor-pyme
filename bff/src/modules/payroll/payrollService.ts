import { axelor } from "../../services/axelor/axelorClient.js";
import { expensesService } from "../expenses/expensesService.js";
import { EmployeeInput, AdvanceInput, PayrollRunInput } from "./payrollTypes.js";
import { SEED_EMPLOYEES } from "../../data/masterRelationalSeed.js";

export const CUSTOM_EMPLOYEES: any[] = [];

export class PayrollService {
  // ==========================================
  // EMPLEADOS
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
        const key = (e.code || e.name || "").trim().toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          employees.push(e);
        }
      }
      return employees;
    } catch {
      return [...CUSTOM_EMPLOYEES, ...SEED_EMPLOYEES];
    }
  }

  public async createEmployee(input: EmployeeInput): Promise<any> {
    const code = input.code || `EMP-${Math.floor(100 + Math.random() * 900)}`;

    // 1. Create Employee Partner
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
    if (!partner || !partner.id) {
      throw new Error(`Error al registrar contacto de empleado: ${JSON.stringify(partnerRes)}`);
    }

    // 2. Create HR Employee Record
    const empRes = await axelor.create("com.axelor.apps.hr.db.Employee", {
      name: input.name,
      code: code,
      contactPartner: { id: partner.id },
      company: { id: input.companyId },
      exportCode: code,
    });
    const emp = Array.isArray(empRes.data) ? empRes.data[0] : empRes.data;
    if (!emp || !emp.id) {
      throw new Error(`Error al registrar empleado: ${JSON.stringify(empRes)}`);
    }

    return {
      id: emp.id,
      name: input.name,
      code,
      taxId: input.taxId,
      jobTitle: input.jobTitle,
      baseSalary: input.baseSalary,
      paymentPeriod: input.paymentPeriod,
      companyId: input.companyId,
      partnerId: partner.id,
    };
  }

  // ==========================================
  // ANTICIPOS A EMPLEADOS
  // ==========================================

  public async createAdvance(input: AdvanceInput): Promise<{
    success: boolean;
    employeeId: number;
    amount: number;
    paymentMethod: string;
    moveId: number;
    date: string;
  }> {
    const today = input.date || new Date().toISOString().slice(0, 10);
    const isCash = input.paymentMethod === "CASH";

    // 1. Fetch employee
    const emp = await axelor.fetch("com.axelor.apps.hr.db.Employee", input.employeeId);
    const empName = emp?.name || `Empleado #${input.employeeId}`;

    // 2. Resolve Accounting Entities
    const periodId = await expensesService.ensureAccountingPeriod(input.companyId, today);
    const advanceAccountId = await expensesService.resolveAccount(input.companyId, "107"); // Anticipos a Empleados / Deudores Diversos
    const paymentAccountId = await expensesService.resolveAccount(input.companyId, isCash ? "101" : "102");
    const journalId = await expensesService.resolveJournal(input.companyId, isCash);

    // 3. Create Accounting Move
    const movePayload = {
      company: { id: input.companyId },
      journal: { id: journalId },
      period: { id: periodId },
      date: today,
      statusSelect: 1,
      origin: `Anticipo Empleado: [${empName}] $${input.amount}`,
      lineList: [
        {
          account: { id: advanceAccountId },
          debit: input.amount,
          credit: 0.0,
          name: `Anticipo a ${empName}`,
        },
        {
          account: { id: paymentAccountId },
          debit: 0.0,
          credit: input.amount,
          name: `Desembolso ${input.paymentMethod} Anticipo`,
        },
      ],
    };

    const res = await axelor.create("com.axelor.apps.account.db.Move", movePayload);
    const moveItem = Array.isArray(res.data) ? res.data[0] : res.data;
    if (!moveItem || !moveItem.id) {
      throw new Error(`Error al registrar anticipo contable: ${JSON.stringify(res)}`);
    }

    return {
      success: true,
      employeeId: input.employeeId,
      amount: input.amount,
      paymentMethod: input.paymentMethod,
      moveId: moveItem.id,
      date: today,
    };
  }

  public async listAdvances(companyId: number, employeeId?: number): Promise<any[]> {
    let domain = `self.company.id = ${companyId} and self.origin like 'Anticipo Empleado:%'`;
    if (employeeId) {
      const emp = await axelor.fetch("com.axelor.apps.hr.db.Employee", employeeId);
      if (emp?.name) {
        domain += ` and self.origin like '%[${emp.name}]%'`;
      }
    }

    const res = await axelor.search("com.axelor.apps.account.db.Move", {
      data: { _domain: domain },
      limit: 100,
      sortBy: ["-createdOn"],
    });
    return Array.isArray(res.data) ? res.data : [];
  }

  // ==========================================
  // DISPERSIÓN DE NÓMINA (PLANILLA EXPRESS)
  // ==========================================

  public async runPayroll(input: PayrollRunInput): Promise<{
    success: boolean;
    period: string;
    employeeCount: number;
    totalGross: number;
    totalAdvancesDeducted: number;
    totalNetPaid: number;
    moveId: number;
    timestamp: string;
  }> {
    const today = new Date().toISOString().slice(0, 10);
    const isCash = input.paymentMethod === "CASH";

    let totalGross = 0;
    let totalAdvances = 0;
    let totalNet = 0;

    for (const item of input.items) {
      const gross = Number((item.baseSalary + (item.bonus || 0) - (item.deductions || 0)).toFixed(2));
      const advance = Number((item.advanceDeduction || 0).toFixed(2));
      const net = Number((gross - advance).toFixed(2));

      totalGross += gross;
      totalAdvances += advance;
      totalNet += net;
    }

    totalGross = Number(totalGross.toFixed(2));
    // 0. Check for existing payroll run in this period
    try {
      const existing = await axelor.search("com.axelor.apps.account.db.Move", {
        data: {
          _domain: `self.company.id = ${input.companyId} and self.origin like 'Nómina Express: [${input.period}]%'`,
        },
        limit: 1,
      });
      if (existing.data && existing.data.length > 0) {
        throw new Error(`La dispersión de nómina para el periodo [${input.period}] ya fue procesada previamente (Póliza #${existing.data[0].id}). No es posible duplicarla.`);
      }
    } catch (e: any) {
      if (e.message && e.message.includes("ya fue procesada")) throw e;
    }

    // 1. Resolve Accounting Entities
    const periodId = await expensesService.ensureAccountingPeriod(input.companyId, today);
    const salaryAccountId = await expensesService.resolveAccount(input.companyId, "602"); // Sueldos y Salarios
    const advanceAccountId = await expensesService.resolveAccount(input.companyId, "107"); // Anticipos
    const paymentAccountId = await expensesService.resolveAccount(input.companyId, isCash ? "101" : "102");
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

    lines.push({
      account: { id: paymentAccountId },
      debit: 0.0,
      credit: totalNet,
      name: `Dispersión Neta Nómina ${input.paymentMethod} ${input.period}`,
    });

    // 3. Create Balanced Accounting Move (Asiento 602.01)
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
    if (!moveItem || !moveItem.id) {
      throw new Error(`Error al registrar asiento de nómina: ${JSON.stringify(res)}`);
    }

    return {
      success: true,
      period: input.period,
      employeeCount: input.items.length,
      totalGross,
      totalAdvancesDeducted: totalAdvances,
      totalNetPaid: totalNet,
      moveId: moveItem.id,
      timestamp: new Date().toISOString(),
    };
  }

  public async listPayrollRuns(companyId: number): Promise<any[]> {
    const res = await axelor.search("com.axelor.apps.account.db.Move", {
      data: {
        _domain: `self.company.id = ${companyId} and self.origin like 'Nómina Express:%'`,
      },
      limit: 50,
      sortBy: ["-createdOn"],
    });
    return Array.isArray(res.data) ? res.data : [];
  }
}

export const payrollService = new PayrollService();
