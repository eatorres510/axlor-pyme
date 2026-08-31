import { describe, it, expect, beforeAll } from "vitest";
import { axelor } from "../services/axelor/axelorClient.js";
import { onboardingService } from "../modules/onboarding/onboardingService.js";
import { expensesService } from "../modules/expenses/expensesService.js";
import { payrollService } from "../modules/payroll/payrollService.js";

describe("Fase 4: Gastos Operativos & Planilla Express E2E Tests", () => {
  let companyId: number;
  let employeeId: number;

  beforeAll(async () => {
    await axelor.authenticate();

    // 1. Onboard Company for Phase 4
    const randomSuffix = Math.floor(Math.random() * 10000);
    const onboard = await onboardingService.onboardCompany({
      name: `Empresa Fase 4 PyME ${randomSuffix}`,
      taxId: `F4${randomSuffix}RFC`,
      currencyCode: "MXN",
    });
    companyId = onboard.company.id;
  });

  // --- 1. GASTOS OPERATIVOS ---
  it("Debe registrar un gasto de renta pagado en efectivo y generar su asiento contable", async () => {
    const expense = await expensesService.createExpense({
      companyId,
      category: "RENT",
      description: "Renta de Local Comercial Agosto",
      amount: 6000.0,
      taxAmount: 0.0,
      paymentMethod: "CASH",
    });

    expect(expense).toBeDefined();
    expect(expense.id).toBeGreaterThan(0);
    expect(expense.moveId).toBeGreaterThan(0);
    expect(expense.total).toBe(6000.0);
    expect(expense.category).toBe("RENT");
  });

  it("Debe registrar un gasto de servicios públicos con IVA pagado por banco", async () => {
    const expense = await expensesService.createExpense({
      companyId,
      category: "UTILITIES",
      description: "Pago de Energía Eléctrica CFE",
      amount: 1200.0,
      taxAmount: 192.0,
      paymentMethod: "BANK",
    });

    expect(expense).toBeDefined();
    expect(expense.id).toBeGreaterThan(0);
    expect(expense.total).toBe(1392.0);
  });

  it("Debe consultar el resumen de gastos y clasificar importes por categoría", async () => {
    const summary = await expensesService.getExpenseSummary(companyId);

    expect(summary).toBeDefined();
    expect(summary.totalSpent).toBeGreaterThanOrEqual(7392.0);
    expect(summary.byCategory.RENT).toBeGreaterThanOrEqual(6000.0);
    expect(summary.byCategory.UTILITIES).toBeGreaterThanOrEqual(1392.0);
  });

  // --- 2. EMPLEADOS & PLANILLA EXPRESS ---
  it("Debe dar de alta un empleado con sueldo base pactado y asociar su Partner", async () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const employee = await payrollService.createEmployee({
      name: `Carlos Martínez López ${randomNum}`,
      taxId: `MALC900101${randomNum}`,
      jobTitle: "Encargado de Turno",
      baseSalary: 7500.0,
      paymentPeriod: "BIWEEKLY",
      companyId,
      phone: "5558889900",
    });

    expect(employee).toBeDefined();
    expect(employee.id).toBeGreaterThan(0);
    expect(employee.partnerId).toBeGreaterThan(0);
    expect(employee.baseSalary).toBe(7500.0);

    employeeId = employee.id;
  });

  it("Debe registrar un anticipo de sueldo en efectivo y generar asiento en cuenta 107.01", async () => {
    const advance = await payrollService.createAdvance({
      employeeId,
      companyId,
      amount: 1500.0,
      paymentMethod: "CASH",
      notes: "Anticipo solicitado para gastos personales",
    });

    expect(advance.success).toBe(true);
    expect(advance.employeeId).toBe(employeeId);
    expect(advance.amount).toBe(1500.0);
    expect(advance.moveId).toBeGreaterThan(0);

    // Verify in advances list
    const list = await payrollService.listAdvances(companyId, employeeId);
    expect(list.length).toBeGreaterThan(0);
  });

  it("Debe procesar la corrida de nómina con descuento de anticipos y generar asiento 602.01", async () => {
    const payrollRun = await payrollService.runPayroll({
      companyId,
      period: "2026-08-Q2",
      periodType: "BIWEEKLY",
      paymentMethod: "BANK",
      items: [
        {
          employeeId,
          employeeName: "Carlos Martínez López",
          baseSalary: 7500.0,
          bonus: 500.0,
          deductions: 0.0,
          advanceDeduction: 1500.0,
          netPaid: 6500.0, // 7500 + 500 - 1500 = 6500
        },
      ],
      notes: "Segunda Quincena de Agosto 2026",
    });

    expect(payrollRun.success).toBe(true);
    expect(payrollRun.period).toBe("2026-08-Q2");
    expect(payrollRun.employeeCount).toBe(1);
    expect(payrollRun.totalGross).toBe(8000.0); // 7500 + 500
    expect(payrollRun.totalAdvancesDeducted).toBe(1500.0);
    expect(payrollRun.totalNetPaid).toBe(6500.0);
    expect(payrollRun.moveId).toBeGreaterThan(0);
  });

  it("Debe listar las nóminas procesadas en el histórico contable", async () => {
    const runs = await payrollService.listPayrollRuns(companyId);
    expect(runs.length).toBeGreaterThan(0);
  });
});
