import { api } from "./client";

export const treasuryApi = {
  // Reporte Consolidado
  getTreasuryReport: async (companyId: number) => {
    const res = await api.get(`/treasury/report?companyId=${companyId}`);
    return res.data.data;
  },

  // Movimientos & Libro Diario de Caja y Bancos
  listMovements: async (params: {
    companyId?: number;
    sourceType?: "CASH" | "BANK" | "ALL";
    sourceId?: number;
    type?: "INCOME" | "EXPENSE" | "TRANSFER" | "ALL";
    paymentMethod?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    q?: string;
    limit?: number;
    offset?: number;
  }) => {
    const query = new URLSearchParams();
    if (params.companyId) query.set("companyId", String(params.companyId));
    if (params.sourceType) query.set("sourceType", params.sourceType);
    if (params.sourceId) query.set("sourceId", String(params.sourceId));
    if (params.type) query.set("type", params.type);
    if (params.paymentMethod) query.set("paymentMethod", params.paymentMethod);
    if (params.category) query.set("category", params.category);
    if (params.startDate) query.set("startDate", params.startDate);
    if (params.endDate) query.set("endDate", params.endDate);
    if (params.q) query.set("q", params.q);
    if (params.limit) query.set("limit", String(params.limit));
    if (params.offset) query.set("offset", String(params.offset));

    const res = await api.get(`/treasury/movements?${query.toString()}`);
    return res.data;
  },

  createMovement: async (payload: {
    companyId: number;
    type: "INCOME" | "EXPENSE" | "TRANSFER";
    sourceType: "CASH" | "BANK";
    sourceId: number;
    targetType?: "CASH" | "BANK";
    targetId?: number;
    amount: number;
    paymentMethod: "CASH" | "CARD" | "TRANSFER" | "CHECK" | "SPEI";
    reference: string;
    description: string;
    partnerName?: string;
    category:
      | "VENTA_POS"
      | "VENTA_B2B"
      | "PAGO_PROVEEDOR"
      | "GASTO_OPERATIVO"
      | "NOMINA"
      | "TRASPASO"
      | "FONDO_INICIAL"
      | "AJUSTE_ARQUEO";
  }) => {
    const res = await api.post("/treasury/movements", payload);
    return res.data.data;
  },

  toggleReconcile: async (movementId: string) => {
    const res = await api.post(`/treasury/movements/${movementId}/reconcile`);
    return res.data;
  },

  // Cajas de Efectivo & Arqueos
  listCashRegisters: async (companyId: number) => {
    const res = await api.get(`/treasury/cash-registers?companyId=${companyId}`);
    return res.data.data;
  },

  createCashRegister: async (payload: {
    name: string;
    branchName?: string;
    initialBalance?: number;
    accountCode?: string;
    companyId: number;
  }) => {
    const res = await api.post("/treasury/cash-registers", payload);
    return res.data.data;
  },

  auditShift: async (
    id: number,
    payload: {
      openingCash: number;
      physicalAmount: number;
      shiftName?: string;
      auditorName?: string;
      denominations?: Record<number, number>;
      notes?: string;
    }
  ) => {
    const res = await api.post(`/treasury/cash-registers/${id}/audit`, payload);
    return res.data.data;
  },

  getCashCuadre: async (id: number) => {
    const res = await api.get(`/treasury/cash-registers/${id}/cuadre`);
    return res.data.data;
  },

  // Cuentas Bancarias & Conciliación
  listBankAccounts: async (companyId: number) => {
    const res = await api.get(`/treasury/bank-accounts?companyId=${companyId}`);
    return res.data.data;
  },

  createBankAccount: async (payload: {
    accountNumber: string;
    bankName: string;
    currencyCode?: string;
    initialBalance?: number;
    label?: string;
    companyId: number;
  }) => {
    const res = await api.post("/treasury/bank-accounts", payload);
    return res.data.data;
  },

  deleteBankAccount: async (id: number) => {
    const res = await api.delete(`/treasury/bank-accounts/${id}`);
    return res.data.success;
  },

  getBankReconciliation: async (id: number) => {
    const res = await api.get(`/treasury/bank-accounts/${id}/reconciliation`);
    return res.data.data;
  },

  // Traspasos
  transfer: async (payload: {
    companyId: number;
    fromType: "CASH" | "BANK";
    fromId: number;
    toType: "CASH" | "BANK";
    toId: number;
    amount: number;
    reference?: string;
    notes?: string;
  }) => {
    const res = await api.post("/treasury/transfers", payload);
    return res.data.data;
  },
};
