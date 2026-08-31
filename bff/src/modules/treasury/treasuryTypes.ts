import { z } from "zod";

// --- Cajas de Efectivo ---
export const CashRegisterSchema = z.object({
  name: z.string().min(2, "El nombre de la caja es requerido"),
  branchName: z.string().optional().default("Sucursal Principal"),
  companyId: z.number().min(1, "El ID de empresa es requerido"),
  initialBalance: z.coerce.number().min(0).default(0),
  accountCode: z.string().default("101.01"),
});

export type CashRegisterInput = z.infer<typeof CashRegisterSchema>;

// --- Arqueo / Corte de Turno ---
export const CashAuditSchema = z.object({
  cashRegisterId: z.number().min(1, "El ID de la caja es requerido"),
  openingCash: z.coerce.number().min(0).default(1000),
  physicalAmount: z.coerce.number().min(0, "El monto físico contado es requerido"),
  shiftName: z.string().optional().default("Cierre de Turno"),
  auditorName: z.string().optional().default("Cajero Principal"),
  denominations: z.record(z.coerce.number()).optional(),
  notes: z.string().optional(),
});

export type CashAuditInput = z.infer<typeof CashAuditSchema>;

export interface CashAuditResult {
  auditId: string;
  cashRegisterId: number;
  cashRegisterName: string;
  shiftName: string;
  openingCash: number;
  totalCashSales: number;
  totalCardSales: number;
  totalCashOutflows: number;
  expectedAmount: number;
  physicalAmount: number;
  difference: number; // physicalAmount - expectedAmount (+ sobrante, - faltante)
  status: "BALANCED" | "SURPLUS" | "SHORTAGE";
  timestamp: string;
  auditorName: string;
  notes?: string;
}

// --- Cuentas Bancarias ---
export const BankAccountSchema = z.object({
  bankName: z.string().min(2, "El nombre del banco es requerido"),
  accountNumber: z.string().min(4, "El número de cuenta / CLABE es requerido"),
  currencyCode: z.string().length(3).default("MXN"),
  companyId: z.number().min(1, "El ID de empresa es requerido"),
  initialBalance: z.coerce.number().min(0).default(0),
  label: z.string().optional(),
});

export type BankAccountInput = z.infer<typeof BankAccountSchema>;

// --- Traspasos Internos de Tesorería ---
export const TreasuryTransferSchema = z.object({
  companyId: z.number().min(1, "El ID de empresa es requerido"),
  fromType: z.enum(["CASH", "BANK"]),
  fromId: z.number().min(1, "El ID de origen es requerido"),
  toType: z.enum(["CASH", "BANK"]),
  toId: z.number().min(1, "El ID de destino es requerido"),
  amount: z.coerce.number().positive("El monto a transferir debe ser mayor a 0"),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export type TreasuryTransferInput = z.infer<typeof TreasuryTransferSchema>;

// --- Movimientos Detallados de Tesorería (Libro Diario de Caja y Bancos) ---
export type MovementType = "INCOME" | "EXPENSE" | "TRANSFER";
export type PaymentMethod = "CASH" | "CARD" | "TRANSFER" | "CHECK" | "SPEI";
export type MovementCategory =
  | "VENTA_POS"
  | "VENTA_B2B"
  | "PAGO_PROVEEDOR"
  | "GASTO_OPERATIVO"
  | "NOMINA"
  | "TRASPASO"
  | "FONDO_INICIAL"
  | "AJUSTE_ARQUEO";

export interface TreasuryMovement {
  id: string;
  voucherSeq?: string;
  companyId: number;
  date: string;
  type: MovementType;
  sourceType: "CASH" | "BANK";
  sourceId: number;
  sourceName: string;
  targetType?: "CASH" | "BANK";
  targetId?: number;
  targetName?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  reference: string;
  description: string;
  partnerName?: string;
  category: MovementCategory;
  reconciled: boolean;
  runningBalance?: number;
}

export const CreateMovementSchema = z.object({
  companyId: z.number().min(1),
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  sourceType: z.enum(["CASH", "BANK"]),
  sourceId: z.number().min(1),
  targetType: z.enum(["CASH", "BANK"]).optional(),
  targetId: z.number().optional(),
  amount: z.coerce.number().positive(),
  paymentMethod: z.enum(["CASH", "CARD", "TRANSFER", "CHECK", "SPEI"]),
  reference: z.string().min(1),
  description: z.string().min(2),
  partnerName: z.string().optional(),
  category: z.enum([
    "VENTA_POS",
    "VENTA_B2B",
    "PAGO_PROVEEDOR",
    "GASTO_OPERATIVO",
    "NOMINA",
    "TRASPASO",
    "FONDO_INICIAL",
    "AJUSTE_ARQUEO",
  ]),
});

export type CreateMovementInput = z.infer<typeof CreateMovementSchema>;

// --- Reporte Consolidado y Flujo de Fondos ---
export interface TreasuryReportSummary {
  period: string;
  totalCashBalance: number;
  totalBankBalance: number;
  totalAvailableLiquidity: number;
  totalPeriodIncome: number;
  totalPeriodExpense: number;
  netCashFlow: number;
  cashRegistersSummary: Array<{
    id: number;
    name: string;
    code: string;
    openingBalance: number;
    currentBalance: number;
    totalInflows: number;
    totalOutflows: number;
    lastAuditDate?: string;
    lastAuditStatus?: "BALANCED" | "SURPLUS" | "SHORTAGE" | "PENDING";
  }>;
  bankAccountsSummary: Array<{
    id: number;
    bankName: string;
    label: string;
    accountNumber: string;
    currentBalance: number;
    totalDeposits: number;
    totalWithdrawals: number;
    reconciledBalance: number;
    unreconciledCount: number;
  }>;
  movementsCount: number;
}

// --- Reporte de Cuadre de Caja (Corte de Turno) ---
export interface CashCuadreReport {
  cashRegisterId: number;
  cashRegisterName: string;
  date: string;
  shiftName: string;
  cashierName: string;
  initialCash: number;
  totalCashSales: number;
  totalCardSales: number;
  totalTransferSales: number;
  totalCashExpenses: number;
  totalCashDeposited: number;
  expectedCashInDrawer: number;
  physicalCashCounted: number;
  difference: number;
  status: "BALANCED" | "SURPLUS" | "SHORTAGE";
  movements: TreasuryMovement[];
  denominationBreakdown?: Record<number, number>;
  notes?: string;
}

// --- Reporte de Conciliación Bancaria ---
export interface BankReconciliationReport {
  bankAccountId: number;
  bankName: string;
  accountNumber: string;
  asOfDate: string;
  erpBookBalance: number;
  bankStatementBalance: number;
  unreconciledDeposits: number;
  unreconciledWithdrawals: number;
  adjustedBankBalance: number;
  difference: number;
  isReconciled: boolean;
  pendingTransactions: TreasuryMovement[];
}
