import { api } from "./client";

export interface Invoice {
  id: number;
  invoiceSeq?: string;
  invoiceDate?: string;
  dueDate?: string;
  inTaxTotal?: number;
  amountPaid?: number;
  amountRemaining?: number;
  partner?: {
    id: number;
    name?: string;
    fullName?: string;
  };
  operationSubTypeSelect?: number; // 1: Customer (CxC), 2: Supplier (CxP)
  statusSelect?: number;
}

export interface AgingBucket {
  current: number;
  days31to60: number;
  days61to90: number;
  over90: number;
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
  type: "CUSTOMER" | "SUPPLIER";
  generatedAt: string;
  summary: AgingBucket;
  invoices: AgingItem[];
}

export interface BankReconciliationItem {
  id: string;
  date: string;
  concept: string;
  amount: number;
  type: "DEPOSIT" | "WITHDRAWAL";
  matched: boolean;
  matchedMoveOrigin?: string;
}

export interface PnLReport {
  companyId: number;
  period: string;
  revenue: {
    sales: number;
    otherIncome: number;
    totalRevenue: number;
  };
  cogs: {
    costOfGoodsSold: number;
    totalCogs: number;
  };
  grossProfit: number;
  grossMarginPct: number;
  operatingExpenses: {
    salaries: number;
    rent: number;
    services: number;
    otherExpenses: number;
    totalExpenses: number;
  };
  operatingIncome: number;
  netProfit: number;
  netMarginPct: number;
}

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
  month: string;
  monthLabel: string;
  shortLabel: string;
  totalSales: number;
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

export const financeApi = {
  listInvoices: async (params: {
    companyId: number;
    type?: "CUSTOMER" | "SUPPLIER";
    statusSelect?: number;
    limit?: number;
  }): Promise<{ invoices: Invoice[]; total: number }> => {
    const res = await api.get<{ success: boolean; data: Invoice[]; total: number }>("/finance/invoices", {
      params,
    });
    return {
      invoices: res.data.data,
      total: res.data.total,
    };
  },

  registerPayment: async (
    invoiceId: number,
    data: {
      amount: number;
      paymentMethod: "CASH" | "BANK_TRANSFER" | "CHECK";
      paymentDate?: string;
      notes?: string;
    }
  ) => {
    const res = await api.post<{ success: boolean; data: any }>(`/finance/invoices/${invoiceId}/payment`, data);
    return res.data.data;
  },

  registerMultiPayment: async (data: {
    companyId: number;
    partnerId: number;
    totalAmount: number;
    paymentMethod: "CASH" | "BANK_TRANSFER" | "CHECK";
    allocations: Array<{ invoiceId: number; amount: number }>;
  }) => {
    const res = await api.post<{ success: boolean; data: any }>("/finance/multi-payments", data);
    return res.data.data;
  },

  getAgingReport: async (companyId: number, type: "CUSTOMER" | "SUPPLIER"): Promise<AgingReport> => {
    const res = await api.get<{ success: boolean; data: AgingReport }>("/finance/aging", {
      params: { companyId, type },
    });
    return res.data.data;
  },

  getBankReconciliation: async (companyId: number): Promise<{
    matchedCount: number;
    unmatchedCount: number;
    statementBalance: number;
    ledgerBalance: number;
    difference: number;
    items: BankReconciliationItem[];
  }> => {
    const res = await api.get<{ success: boolean; data: any }>("/finance/bank-reconciliation", {
      params: { companyId },
    });
    return res.data.data;
  },

  matchReconciliation: async (companyId: number, itemId: string, matchedOrigin: string) => {
    const res = await api.post<{ success: boolean; data: any }>("/finance/bank-reconciliation/match", {
      companyId,
      itemId,
      matchedOrigin,
    });
    return res.data.data;
  },

  unmatchReconciliation: async (companyId: number, itemId: string) => {
    const res = await api.post<{ success: boolean; data: any }>("/finance/bank-reconciliation/unmatch", {
      companyId,
      itemId,
    });
    return res.data.data;
  },

  autoMatchReconciliation: async (companyId: number) => {
    const res = await api.post<{ success: boolean; data: any }>("/finance/bank-reconciliation/auto-match", {
      companyId,
    });
    return res.data.data;
  },

  adjustReconciliation: async (companyId: number, itemId: string, accountCode: string, accountName: string) => {
    const res = await api.post<{ success: boolean; data: any }>("/finance/bank-reconciliation/adjust", {
      companyId,
      itemId,
      accountCode,
      accountName,
    });
    return res.data.data;
  },

  importReconciliationItem: async (companyId: number, item: Omit<BankReconciliationItem, "id">) => {
    const res = await api.post<{ success: boolean; data: any }>("/finance/bank-reconciliation/import", {
      companyId,
      item,
    });
    return res.data.data;
  },

  createCreditNote: async (
    invoiceId: number,
    data: {
      creditAmount: number;
      reason: "DEVOLUCION_MERCANCIA" | "BONIFICACION_DESCUENTO" | "ERROR_FACTURACION";
      returnStock: boolean;
      locationId?: number;
      items?: Array<{ productId: number; productName?: string; qty: number; unitPrice: number }>;
      notes?: string;
    }
  ) => {
    const res = await api.post<{ success: boolean; data: any }>(`/finance/invoices/${invoiceId}/credit-note`, data);
    return res.data.data;
  },

  getIncomeStatement: async (companyId: number): Promise<PnLReport> => {
    const res = await api.get<{ success: boolean; data: PnLReport }>("/finance/pnl", {
      params: { companyId },
    });
    return res.data.data;
  },

  getPartnerStatement: async (partnerId: number, companyId: number): Promise<PartnerStatement> => {
    const res = await api.get<{ success: boolean; data: PartnerStatement }>(`/finance/partners/${partnerId}/statement`, {
      params: { companyId },
    });
    return res.data.data;
  },
};
