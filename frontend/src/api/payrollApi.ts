import { api } from "./client";

export const payrollApi = {
  listEmployees: async (companyId: number) => {
    const res = await api.get(`/payroll/employees?companyId=${companyId}`);
    return res.data.data;
  },
  createEmployee: async (payload: {
    name: string;
    taxId: string;
    jobTitle?: string;
    baseSalary: number;
    paymentPeriod?: "WEEKLY" | "BIWEEKLY" | "MONTHLY";
    companyId: number;
    phone?: string;
    email?: string;
  }) => {
    const res = await api.post("/payroll/employees", payload);
    return res.data.data;
  },
  createAdvance: async (payload: {
    employeeId: number;
    companyId: number;
    amount: number;
    paymentMethod?: "CASH" | "BANK";
    date?: string;
    notes?: string;
  }) => {
    const res = await api.post("/payroll/advances", payload);
    return res.data.data;
  },
  listAdvances: async (companyId: number, employeeId?: number) => {
    let url = `/payroll/advances?companyId=${companyId}`;
    if (employeeId) url += `&employeeId=${employeeId}`;
    const res = await api.get(url);
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
      deductions?: number;
      advanceDeduction?: number;
      netPaid: number;
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
