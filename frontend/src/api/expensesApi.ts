import { api } from "./client";

export const expensesApi = {
  listExpenses: async (companyId: number, category?: string) => {
    let url = `/expenses?companyId=${companyId}`;
    if (category) url += `&category=${category}`;
    const res = await api.get(url);
    return res.data.data;
  },
  createExpense: async (payload: {
    companyId: number;
    category: string;
    description: string;
    amount: number;
    taxAmount?: number;
    paymentMethod?: "CASH" | "BANK";
    supplierId?: number;
    creditorName?: string;
    supplierName?: string;
    expenseDate?: string;
    notes?: string;
  }) => {
    const res = await api.post("/expenses", payload);
    return res.data.data;
  },
  getSummary: async (companyId: number) => {
    const res = await api.get(`/expenses/summary?companyId=${companyId}`);
    return res.data.data;
  },
};
