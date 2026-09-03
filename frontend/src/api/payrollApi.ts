import { api } from "./client";

export const payrollApi = {
  // --- Empleados ---
  listEmployees: async (companyId: number) => {
    const res = await api.get(`/payroll/employees?companyId=${companyId}`);
    return res.data.data;
  },
  createEmployee: async (payload: {
    name: string;
    code?: string;
    taxId: string;
    jobTitle?: string;
    department?: string;
    baseSalary: number;
    paymentPeriod?: "WEEKLY" | "BIWEEKLY" | "MONTHLY";
    companyId: number;
    phone?: string;
    email?: string;
    bankName?: string;
    bankAccount?: string;
    clabe?: string;
    hireDate?: string;
  }) => {
    const res = await api.post("/payroll/employees", payload);
    return res.data.data;
  },
  updateEmployee: async (id: number, payload: Partial<{
    name: string;
    code: string;
    taxId: string;
    jobTitle: string;
    department: string;
    baseSalary: number;
    paymentPeriod: "WEEKLY" | "BIWEEKLY" | "MONTHLY";
    phone: string;
    email: string;
    bankName: string;
    bankAccount: string;
    clabe: string;
    hireDate: string;
    status: "ACTIVE" | "INACTIVE";
  }>) => {
    const res = await api.put(`/payroll/employees/${id}`, payload);
    return res.data.data;
  },
  deleteEmployee: async (id: number) => {
    const res = await api.delete(`/payroll/employees/${id}`);
    return res.data.data;
  },

  // --- Periodos de Nómina ---
  listPeriods: async (companyId: number) => {
    const res = await api.get(`/payroll/periods?companyId=${companyId}`);
    return res.data.data;
  },
  createPeriod: async (payload: {
    companyId: number;
    code: string;
    name: string;
    periodType?: "WEEKLY" | "BIWEEKLY" | "MONTHLY";
    startDate: string;
    endDate: string;
    paymentDate: string;
    notes?: string;
  }) => {
    const res = await api.post("/payroll/periods", payload);
    return res.data.data;
  },
  updatePeriod: async (id: number, payload: Partial<{
    code: string;
    name: string;
    periodType: "WEEKLY" | "BIWEEKLY" | "MONTHLY";
    startDate: string;
    endDate: string;
    paymentDate: string;
    status: "OPEN" | "PROCESSING" | "PAID" | "CLOSED";
    notes: string;
  }>) => {
    const res = await api.put(`/payroll/periods/${id}`, payload);
    return res.data.data;
  },

  // --- Anticipos y Préstamos ---
  listAdvances: async (
    companyId: number,
    filters?: { employeeId?: number; status?: string; periodCode?: string }
  ) => {
    let url = `/payroll/advances?companyId=${companyId}`;
    if (filters?.employeeId) url += `&employeeId=${filters.employeeId}`;
    if (filters?.status && filters.status !== "ALL") url += `&status=${filters.status}`;
    if (filters?.periodCode && filters.periodCode !== "ALL") url += `&periodCode=${filters.periodCode}`;
    const res = await api.get(url);
    return res.data.data;
  },
  createAdvance: async (payload: {
    employeeId: number;
    companyId: number;
    periodCode?: string;
    amount: number;
    paymentMethod?: "CASH" | "BANK";
    date?: string;
    notes?: string;
  }) => {
    const res = await api.post("/payroll/advances", payload);
    return res.data.data;
  },
  updateAdvance: async (id: number, payload: {
    amount?: number;
    paymentMethod?: "CASH" | "BANK";
    date?: string;
    notes?: string;
    periodCode?: string;
  }) => {
    const res = await api.put(`/payroll/advances/${id}`, payload);
    return res.data;
  },
  authorizeAdvance: async (id: number, payload: {
    companyId: number;
    paymentMethod?: "CASH" | "BANK";
    authorizedBy?: string;
  }) => {
    const res = await api.post(`/payroll/advances/${id}/authorize`, payload);
    return res.data;
  },
  rejectAdvance: async (id: number, reason?: string) => {
    const res = await api.post(`/payroll/advances/${id}/reject`, { reason });
    return res.data;
  },

  // --- Planilla & Dispersión ---
  getPayrollPreview: async (companyId: number, period: string) => {
    const res = await api.get(`/payroll/runs/preview?companyId=${companyId}&period=${period}`);
    return res.data.data;
  },
  runPayroll: async (payload: {
    companyId: number;
    period: string;
    periodType?: "WEEKLY" | "BIWEEKLY" | "MONTHLY";
    paymentMethod?: "CASH" | "BANK";
    items: Array<{
      employeeId: number;
      employeeName: string;
      baseSalary: number;
      bonus?: number;
      overtime?: number;
      taxDeduction?: number;
      imssDeduction?: number;
      otherDeductions?: number;
      advanceDeduction?: number;
      advanceIds?: number[];
      netPaid: number;
      notes?: string;
    }>;
    notes?: string;
  }) => {
    const res = await api.post("/payroll/runs", payload);
    return res.data.data;
  },
  listRuns: async (companyId: number) => {
    const res = await api.get(`/payroll/runs?companyId=${companyId}`);
    return res.data.data;
  },
};

