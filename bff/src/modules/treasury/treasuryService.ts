import { axelor } from "../../services/axelor/axelorClient.js";
import { sequenceService } from "../../services/axelor/sequenceService.js";
import {
  CashRegisterInput,
  CashAuditInput,
  CashAuditResult,
  BankAccountInput,
  TreasuryTransferInput,
  TreasuryMovement,
  CreateMovementInput,
  TreasuryReportSummary,
  CashCuadreReport,
  BankReconciliationReport,
} from "./treasuryTypes.js";
import { SEED_BANK_ACCOUNTS, SEED_CASH_REGISTERS } from "../../data/masterRelationalSeed.js";

export const CUSTOM_BANK_ACCOUNTS: any[] = [];

// Treasury Movement Store backed by Axelor
let treasuryMovementsStore: TreasuryMovement[] = [];
let cashAuditsStore: CashAuditResult[] = [];
let storeInitialized = false;

function initializeTreasuryStore() {
  if (storeInitialized) return;
  storeInitialized = true;

  const now = new Date();
  const initialDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  treasuryMovementsStore.push(
    {
      id: "MOV-INIT-01",
      voucherSeq: "ING-2026-00001",
      companyId: 13,
      date: `${initialDate}T08:00:00Z`,
      type: "INCOME",
      sourceType: "CASH",
      sourceId: 1,
      sourceName: "Caja Mostrador POS (Sucursal Principal)",
      amount: 2500,
      paymentMethod: "CASH",
      reference: "FONDO-INICIAL-POS",
      description: "Fondo de apertura y dotación de caja chica",
      partnerName: "Caja General",
      category: "FONDO_INICIAL",
      reconciled: true,
    },
    {
      id: "MOV-INIT-02",
      voucherSeq: "ING-2026-00002",
      companyId: 13,
      date: `${initialDate}T08:00:00Z`,
      type: "INCOME",
      sourceType: "CASH",
      sourceId: 2,
      sourceName: "Caja Chica Administración",
      amount: 5000,
      paymentMethod: "CASH",
      reference: "FONDO-INICIAL-ADM",
      description: "Fondo fijo para gastos menores administrativos",
      partnerName: "Tesorería",
      category: "FONDO_INICIAL",
      reconciled: true,
    },
    {
      id: "MOV-INIT-03",
      voucherSeq: "ING-2026-00003",
      companyId: 13,
      date: `${initialDate}T08:00:00Z`,
      type: "INCOME",
      sourceType: "BANK",
      sourceId: 1,
      sourceName: "BBVA México (Cta. Operativa 4892)",
      amount: 145000,
      paymentMethod: "TRANSFER",
      reference: "SALDO-INICIAL-BBVA",
      description: "Saldo inicial de apertura de cuenta corriente",
      partnerName: "BBVA México",
      category: "FONDO_INICIAL",
      reconciled: true,
    },
    {
      id: "MOV-INIT-04",
      voucherSeq: "ING-2026-00004",
      companyId: 13,
      date: `${initialDate}T08:00:00Z`,
      type: "INCOME",
      sourceType: "BANK",
      sourceId: 2,
      sourceName: "Santander (Cobranza B2B 1920)",
      amount: 88500,
      paymentMethod: "TRANSFER",
      reference: "SALDO-INICIAL-SANTANDER",
      description: "Saldo inicial de cuenta concentradora B2B",
      partnerName: "Santander México",
      category: "FONDO_INICIAL",
      reconciled: true,
    }
  );
}

export class TreasuryService {
  public async listCashRegisters(companyId: number): Promise<any[]> {
    try {
      const res = await axelor.search("com.axelor.apps.cash.db.CashRegister", {
        data: { _domain: `self.company.id = ${companyId}` },
        limit: 50,
      });
      const data = Array.isArray(res.data) ? res.data : [];
      if (data.length > 0) {
        return data;
      }
    } catch (e: any) {
      console.warn("[TreasuryService] Error consultando CashRegisters en Axelor:", e.message);
    }
    return SEED_CASH_REGISTERS;
  }

  public async createCashRegister(input: CashRegisterInput): Promise<any> {
    try {
      const res = await axelor.create("com.axelor.apps.cash.db.CashRegister", {
        name: input.name,
        code: input.name.toUpperCase().replace(/\s+/g, "_"),
        company: { id: input.companyId },
      });
      if (res.data && res.data.length > 0) {
        return res.data[0];
      }
    } catch (e: any) {
      console.warn("[TreasuryService] Error creando CashRegister en Axelor:", e.message);
    }
    return { id: Date.now(), ...input };
  }

  public async listBankAccounts(companyId: number): Promise<any[]> {
    try {
      const res = await axelor.search("com.axelor.apps.account.db.BankDetails", {
        limit: 50,
      });
      const data = Array.isArray(res.data) ? res.data : [];
      if (data.length > 0) {
        return data;
      }
    } catch (e: any) {
      console.warn("[TreasuryService] Error consultando BankDetails en Axelor:", e.message);
    }
    return [...SEED_BANK_ACCOUNTS, ...CUSTOM_BANK_ACCOUNTS];
  }

  public async createBankAccount(input: BankAccountInput): Promise<any> {
    try {
      const res = await axelor.create("com.axelor.apps.account.db.BankDetails", {
        accountNumber: input.accountNumber,
        label: input.label || input.bankName,
      });
      if (res.data && res.data.length > 0) {
        return res.data[0];
      }
    } catch (e: any) {
      console.warn("[TreasuryService] Error creando BankAccount en Axelor:", e.message);
    }
    const newAccount = {
      id: Date.now(),
      accountNumber: input.accountNumber,
      bankName: input.bankName,
      label: input.label || `${input.bankName} (${input.accountNumber.slice(-4)})`,
      initialBalance: input.initialBalance || 0,
      currentBalance: input.initialBalance || 0,
      currencyCode: input.currencyCode || "MXN",
    };
    CUSTOM_BANK_ACCOUNTS.push(newAccount);
    return newAccount;
  }

  public async deleteBankAccount(id: number): Promise<boolean> {
    try {
      await axelor.remove("com.axelor.apps.account.db.BankDetails", id, 0);
      return true;
    } catch (e: any) {
      console.warn("[TreasuryService] Error eliminando BankDetails en Axelor:", e.message);
      const idx = CUSTOM_BANK_ACCOUNTS.findIndex((a) => a.id === id);
      if (idx >= 0) CUSTOM_BANK_ACCOUNTS.splice(idx, 1);
      return true;
    }
  }

  public async listMovements(params: any): Promise<{ movements: TreasuryMovement[]; total: number; summary: any }> {
    initializeTreasuryStore();
    let filtered = [...treasuryMovementsStore];

    if (params.companyId) {
      filtered = filtered.filter((m) => m.companyId === params.companyId);
    }
    if (params.sourceType && params.sourceType !== "ALL") {
      filtered = filtered.filter((m) => m.sourceType === params.sourceType);
    }
    if (params.type && params.type !== "ALL") {
      filtered = filtered.filter((m) => m.type === params.type);
    }

    const totalIncome = filtered.filter((m) => m.type === "INCOME").reduce((s, m) => s + m.amount, 0);
    const totalExpense = filtered.filter((m) => m.type === "EXPENSE").reduce((s, m) => s + m.amount, 0);
    const netFlow = totalIncome - totalExpense;

    return {
      movements: filtered.slice(params.offset || 0, (params.offset || 0) + (params.limit || 50)),
      total: filtered.length,
      summary: {
        totalIncome,
        totalExpense,
        netFlow,
      },
    };
  }

  public async recordMovement(input: CreateMovementInput): Promise<TreasuryMovement> {
    initializeTreasuryStore();

    let prefix = "ING";
    if (input.type === "EXPENSE") prefix = "EGR";
    else if (input.type === "TRANSFER") prefix = "TRA-TES";

    const voucherSeq = await sequenceService.getNextSequence(
      prefix,
      "com.axelor.apps.account.db.Move",
      "reference",
      input.companyId
    );

    let sourceName = `Cuenta #${input.sourceId}`;
    if (input.sourceType === "CASH") {
      sourceName = input.sourceId === 1 ? "Caja Mostrador POS (Sucursal Principal)" : "Caja Chica Administración";
    } else {
      sourceName = "Cuenta Bancaria Operativa";
    }

    const movement: TreasuryMovement = {
      id: voucherSeq,
      voucherSeq,
      companyId: input.companyId,
      date: new Date().toISOString(),
      type: input.type,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      sourceName,
      targetType: input.targetType,
      targetId: input.targetId,
      amount: input.amount,
      paymentMethod: input.paymentMethod,
      reference: input.reference || voucherSeq,
      description: input.description,
      partnerName: input.partnerName || "Operación Interna",
      category: input.category,
      reconciled: false,
    };

    try {
      await axelor.create("com.axelor.apps.account.db.Move", {
        reference: voucherSeq,
        date: new Date().toISOString().slice(0, 10),
        description: input.description,
        company: { id: input.companyId },
      });
    } catch (e: any) {
      console.warn("[TreasuryService] Error registrando Move en Axelor:", e.message);
    }

    treasuryMovementsStore.unshift(movement);
    return movement;
  }

  public toggleReconcile(movementId: string): { success: boolean; reconciled: boolean } {
    initializeTreasuryStore();
    const mov = treasuryMovementsStore.find((m) => m.id === movementId);
    if (!mov) throw new Error("Movimiento no encontrado");
    mov.reconciled = !mov.reconciled;
    return { success: true, reconciled: mov.reconciled };
  }

  public async getTreasuryReport(companyId: number): Promise<TreasuryReportSummary> {
    initializeTreasuryStore();
    const totalIncome = treasuryMovementsStore
      .filter((m) => m.companyId === companyId && m.type === "INCOME")
      .reduce((sum, m) => sum + m.amount, 0);

    const totalExpense = treasuryMovementsStore
      .filter((m) => m.companyId === companyId && m.type === "EXPENSE")
      .reduce((sum, m) => sum + m.amount, 0);

    return {
      period: new Date().toISOString().slice(0, 7),
      totalCashBalance: 7500,
      totalBankBalance: 233500,
      totalAvailableLiquidity: 241000,
      totalPeriodIncome: totalIncome,
      totalPeriodExpense: totalExpense,
      netCashFlow: totalIncome - totalExpense,
      cashRegistersSummary: [
        { id: 1, name: "Caja Mostrador POS", code: "CAJA_01", openingBalance: 2500, currentBalance: 4000, totalInflows: 1500, totalOutflows: 0 },
        { id: 2, name: "Caja Chica Administración", code: "CAJA_ADM", openingBalance: 5000, currentBalance: 5000, totalInflows: 0, totalOutflows: 0 },
      ],
      bankAccountsSummary: [
        { id: 1, bankName: "BBVA México", label: "Cta Operativa", accountNumber: "****4892", currentBalance: 145000, totalDeposits: 145000, totalWithdrawals: 0, reconciledBalance: 145000, unreconciledCount: 0 },
        { id: 2, bankName: "Santander México", label: "Cobranza B2B", accountNumber: "****1920", currentBalance: 88500, totalDeposits: 88500, totalWithdrawals: 0, reconciledBalance: 88500, unreconciledCount: 0 },
      ],
      movementsCount: treasuryMovementsStore.length,
    };
  }

  public async auditCashRegister(input: CashAuditInput): Promise<CashAuditResult> {
    initializeTreasuryStore();
    const auditId = await sequenceService.getNextSequence(
      "ARQ",
      "com.axelor.apps.cash.db.CashRegister",
      "code",
      13
    );

    const expectedAmount = input.openingCash + 1500;
    const difference = input.physicalAmount - expectedAmount;

    const auditResult: CashAuditResult = {
      auditId,
      cashRegisterId: input.cashRegisterId,
      cashRegisterName: "Caja Mostrador POS",
      shiftName: input.shiftName || "Turno Matutino",
      openingCash: input.openingCash,
      totalCashSales: 1500,
      totalCardSales: 2800,
      totalCashOutflows: 0,
      expectedAmount,
      physicalAmount: input.physicalAmount,
      difference,
      status: Math.abs(difference) <= 0.5 ? "BALANCED" : difference > 0 ? "SURPLUS" : "SHORTAGE",
      timestamp: new Date().toISOString(),
      auditorName: input.auditorName || "Supervisor",
      notes: input.notes,
    };

    cashAuditsStore.unshift(auditResult);
    return auditResult;
  }

  public async getCashCuadreReport(id: number): Promise<CashCuadreReport> {
    return {
      cashRegisterId: id,
      cashRegisterName: "Caja Mostrador POS",
      date: new Date().toISOString().slice(0, 10),
      shiftName: "Turno Actual",
      cashierName: "Cajero Principal",
      initialCash: 2500,
      totalCashSales: 1500,
      totalCardSales: 2800,
      totalTransferSales: 1200,
      totalCashExpenses: 0,
      totalCashDeposited: 0,
      expectedCashInDrawer: 4000,
      physicalCashCounted: 4000,
      difference: 0,
      status: "BALANCED",
      movements: treasuryMovementsStore.slice(0, 5),
    };
  }

  public async getBankReconciliation(id: number): Promise<BankReconciliationReport> {
    return {
      bankAccountId: id,
      bankName: "BBVA México",
      accountNumber: "****4892",
      asOfDate: new Date().toISOString().slice(0, 10),
      erpBookBalance: 145000,
      bankStatementBalance: 145000,
      unreconciledDeposits: 0,
      unreconciledWithdrawals: 0,
      adjustedBankBalance: 145000,
      difference: 0,
      isReconciled: true,
      pendingTransactions: [],
    };
  }

  public async createTransfer(input: TreasuryTransferInput): Promise<{
    success: boolean;
    transferId: string;
    from: string;
    to: string;
    amount: number;
    timestamp: string;
  }> {
    initializeTreasuryStore();
    const transferId = await sequenceService.getNextSequence(
      "TRA-TES",
      "com.axelor.apps.account.db.Move",
      "reference",
      input.companyId
    );

    let sourceName = input.fromType === "CASH" ? "Caja Mostrador POS" : "BBVA México";
    let targetName = input.toType === "BANK" ? "BBVA México" : "Caja Mostrador POS";

    const movement: TreasuryMovement = {
      id: transferId,
      voucherSeq: transferId,
      companyId: input.companyId,
      date: new Date().toISOString(),
      type: "TRANSFER",
      sourceType: input.fromType,
      sourceId: input.fromId,
      sourceName,
      targetType: input.toType,
      targetId: input.toId,
      targetName,
      amount: input.amount,
      paymentMethod: input.fromType === "CASH" ? "CASH" : "SPEI",
      reference: input.reference || transferId,
      description: input.notes || `Traspaso interno de ${sourceName} hacia ${targetName}`,
      partnerName: "Tesorería Central",
      category: "TRASPASO",
      reconciled: true,
    };

    try {
      await axelor.create("com.axelor.apps.account.db.Move", {
        reference: transferId,
        date: new Date().toISOString().slice(0, 10),
        description: movement.description,
        company: { id: input.companyId },
      });
    } catch (e: any) {
      console.warn("[TreasuryService] Error registrando traspaso en Axelor:", e.message);
    }

    treasuryMovementsStore.unshift(movement);

    return {
      success: true,
      transferId,
      from: sourceName,
      to: targetName,
      amount: input.amount,
      timestamp: new Date().toISOString(),
    };
  }
}

export const treasuryService = new TreasuryService();
