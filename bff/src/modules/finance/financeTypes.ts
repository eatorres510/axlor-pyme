import { z } from "zod";

export const InvoiceTypeEnum = z.enum(["CUSTOMER", "SUPPLIER"]);
export type InvoiceType = z.infer<typeof InvoiceTypeEnum>;

export const InvoiceListParamsSchema = z.object({
  companyId: z.coerce.number().optional(),
  type: InvoiceTypeEnum.optional(),
  statusSelect: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  offset: z.coerce.number().optional(),
});
export type InvoiceListParams = z.infer<typeof InvoiceListParamsSchema>;

export const InvoiceSchema = z.object({
  companyId: z.number().min(1, "El ID de empresa es requerido"),
  partnerId: z.number().min(1, "El ID de cliente / proveedor es requerido"),
  type: InvoiceTypeEnum,
  invoiceDate: z.string().optional(),
  dueDate: z.string().min(1, "La fecha de vencimiento es requerida"),
  subtotal: z.coerce.number().positive("El subtotal debe ser mayor a 0"),
  taxAmount: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
});
export type InvoiceInput = z.infer<typeof InvoiceSchema>;

export const InvoicePaymentSchema = z.object({
  amount: z.coerce.number().positive("El monto del pago debe ser mayor a 0"),
  paymentMethod: z.enum(["CASH", "BANK", "BANK_TRANSFER", "CHECK", "SPEI", "CARD"]).default("BANK"),
  paymentDate: z.string().optional(),
  notes: z.string().optional(),
});
export type InvoicePaymentInput = z.infer<typeof InvoicePaymentSchema>;

// --- Cobros CxC y Pagos CxP Rápidos (FIFO & Multi-Invoice) ---
export const QuickPaymentAllocationSchema = z.object({
  invoiceId: z.number().min(1, "El ID de factura es requerido"),
  invoiceSeq: z.string().optional(),
  amountPaid: z.coerce.number().positive("El monto aplicado debe ser mayor a 0"),
  previousBalance: z.coerce.number().optional(),
  newBalance: z.coerce.number().optional(),
});
export type QuickPaymentAllocation = z.infer<typeof QuickPaymentAllocationSchema>;

export const QuickPaymentInputSchema = z.object({
  companyId: z.number().min(1, "El ID de empresa es requerido"),
  partnerId: z.number().min(1, "El ID de cliente o proveedor es requerido"),
  partnerName: z.string().optional(),
  partnerType: z.enum(["CUSTOMER", "SUPPLIER"]),
  totalAmount: z.coerce.number().positive("El monto total a aplicar debe ser mayor a 0"),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CHECK", "CARD", "SPEI"]).default("CASH"),
  sourceAccount: z.enum(["CASH", "BANK"]).default("CASH"),
  paymentDate: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  allocations: z.array(QuickPaymentAllocationSchema).min(1, "Debe incluir al menos una factura a saldar"),
});
export type QuickPaymentInput = z.infer<typeof QuickPaymentInputSchema>;

export interface PaymentReceiptRecord {
  id: string | number;
  receiptSeq: string;
  receiptType: "INCOME" | "EXPENSE"; // INCOME = Cobro CxC (Recibo de Caja), EXPENSE = Pago CxP (Comprobante de Egreso)
  companyId: number;
  partnerId: number;
  partnerName: string;
  partnerTaxId?: string;
  totalAmount: number;
  paymentMethod: string;
  sourceAccount: string;
  paymentDate: string;
  reference: string;
  notes?: string;
  status: "PROCESSED"; // Always immutable once processed
  moveId: number;
  invoicesSettled: Array<{
    invoiceId: number;
    invoiceSeq: string;
    amountPaid: number;
    previousBalance: number;
    newBalance: number;
  }>;
  createdAt: string;
}


export interface AgingBucket {
  current: number; // 0-30 días
  days31to60: number; // 31-60 días
  days61to90: number; // 61-90 días
  over90: number; // >90 días
  total: number;
}

export interface AgingItem {
  invoiceId: number;
  invoiceNumber: string;
  partnerId: number;
  partnerName: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  amountPaid: number;
  amountRemaining: number;
  daysOverdue: number;
  bucket: "CURRENT" | "DAYS_31_60" | "DAYS_61_90" | "OVER_90";
}

export interface AgingReport {
  companyId: number;
  type: InvoiceType;
  generatedAt: string;
  summary: AgingBucket;
  invoices: AgingItem[];
}

export const CreditNoteSchema = z.object({
  creditAmount: z.coerce.number().positive("El monto a acreditar debe ser mayor a 0"),
  reason: z.enum(["DEVOLUCION_MERCANCIA", "BONIFICACION_DESCUENTO", "ERROR_FACTURACION"]).default("DEVOLUCION_MERCANCIA"),
  returnStock: z.boolean().default(false),
  locationId: z.coerce.number().optional(),
  items: z
    .array(
      z.object({
        productId: z.number(),
        productName: z.string().optional(),
        qty: z.number().positive(),
        unitPrice: z.number().nonnegative(),
      })
    )
    .optional(),
  notes: z.string().optional(),
});
export type CreditNoteInput = z.infer<typeof CreditNoteSchema>;

export const DebitNoteSchema = z.object({
  debitAmount: z.coerce.number().positive("El monto a debitar debe ser mayor a 0"),
  reason: z.enum(["INTERESES_MORA", "FLETE_ADICIONAL", "AJUSTE_PRECIO", "GASTO_OPERATIVO"]).default("FLETE_ADICIONAL"),
  notes: z.string().optional(),
});
export type DebitNoteInput = z.infer<typeof DebitNoteSchema>;

export interface StatementMovementLine {
  id?: number | string;
  productCode?: string;
  description: string;
  qty: number;
  uom?: string;
  unitPrice: number;
  taxRate?: number;
  total: number;
}

export interface StatementMovement {
  id: string;
  date: string;
  type: "INVOICE" | "PAYMENT" | "CREDIT_NOTE" | "DEBIT_NOTE";
  docNumber: string;
  concept: string;
  debit: number;
  credit: number;
  runningBalance: number;
  dueDate?: string;
  isOverdue?: boolean;
  paymentMethod?: string;
  subtotal?: number;
  taxAmount?: number;
  notes?: string;
  lines?: StatementMovementLine[];
  accountingMove?: string;
}

export interface DailySalesTrend {
  date: string;       // "2026-08-15"
  dayLabel: string;   // "15 Ago"
  weekday: string;    // "Vie"
  totalSales: number; // Monto facturado / comprado en ese día
  docCount: number;
  docType?: "INVOICE" | "ORDER" | "PAYMENT";
  docNumbers: string[];
}

export interface MonthlySalesTrend {
  month: string;       // "2026-03"
  monthLabel: string;  // "Marzo 2026"
  shortLabel: string;  // "Mar"
  totalSales: number;  // Facturación total del mes
  invoiceCount: number;
  paidAmount: number;
}

export interface CreditHealthAnalysis {
  avgMonthlySales: number;
  avgDailySales: number;
  avgOrderFrequencyDays: number;
  avgTicket: number;
  trend: "GROWING" | "STABLE" | "COOLING_DOWN" | "INACTIVE";
  trendPercentage: number;
  creditCoverageRatio: number;
  recommendation: "MAINTAIN" | "REDUCE_LIMIT" | "INCREASE_LIMIT" | "COMMERCIAL_ACTION_REQUIRED";
  recommendationText: string;
  salesHistory: MonthlySalesTrend[];
  dailyHistory: DailySalesTrend[];
}

export interface PartnerStatement {
  companyId: number;
  partnerId: number;
  partnerName: string;
  taxNbr?: string;
  email?: string;
  phone?: string;
  isCustomer: boolean;
  isSupplier: boolean;
  creditLimit: number;
  creditDays: number;
  priceListCode?: string;
  currentBalance: number;
  availableCredit: number;
  creditUsagePct: number;
  overdueBalance: number;
  riskStatus: "NORMAL" | "WARNING" | "BLOCKED";
  movements: StatementMovement[];
  summary: {
    totalInvoiced: number;
    totalPaid: number;
    totalCredited: number;
    netBalance: number;
  };
  creditHealth?: CreditHealthAnalysis;
}
