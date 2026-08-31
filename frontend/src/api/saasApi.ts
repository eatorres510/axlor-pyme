import { api } from "./client";

export interface SaaSPlan {
  code: "STARTER" | "PYME_PRO" | "ENTERPRISE";
  name: string;
  maxCompanies: number;
  maxUsers: number;
  maxPos: number;
  priceMonthly: number;
  currency: string;
  features: string[];
}

export interface TenantRecord {
  id: string;
  code: string;
  name: string;
  planCode: "STARTER" | "PYME_PRO" | "ENTERPRISE";
  adminUsername: string;
  adminName: string;
  adminEmail: string;
  status: "ACTIVE" | "SUSPENDED" | "TRIAL";
  primaryCompanyId: number;
  companyIds: number[];
  createdAt: string;
}

export interface SaaSMetrics {
  totalTenants: number;
  activeTenants: number;
  planBreakdown: Record<string, number>;
  estimatedMRR: number;
  currency: string;
}

export const saasApi = {
  listPlans: async (): Promise<SaaSPlan[]> => {
    const res = await api.get<{ success: boolean; data: SaaSPlan[] }>("/saas/plans");
    return res.data.data;
  },

  listTenants: async (): Promise<TenantRecord[]> => {
    const res = await api.get<{ success: boolean; data: TenantRecord[] }>("/saas/tenants");
    return res.data.data;
  },

  getMetrics: async (): Promise<SaaSMetrics> => {
    const res = await api.get<{ success: boolean; data: SaaSMetrics }>("/saas/metrics");
    return res.data.data;
  },

  provisionTenant: async (payload: {
    tenantName: string;
    tenantCode: string;
    planCode: string;
    taxId: string;
    adminName: string;
    adminUsername: string;
    adminEmail: string;
    adminPassword: string;
  }): Promise<{ tenant: TenantRecord; companyId: number }> => {
    const res = await api.post<{ success: boolean; data: { tenant: TenantRecord; companyId: number } }>(
      "/saas/tenants",
      payload
    );
    return res.data.data;
  },

  updateTenant: async (id: string, payload: Partial<TenantRecord>): Promise<TenantRecord> => {
    const res = await api.put<{ success: boolean; data: TenantRecord }>(`/saas/tenants/${id}`, payload);
    return res.data.data;
  },

  toggleTenantStatus: async (id: string): Promise<TenantRecord> => {
    const res = await api.put<{ success: boolean; data: TenantRecord }>(`/saas/tenants/${id}/status`, {});
    return res.data.data;
  },

  resetTenantPassword: async (id: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.post<{ success: boolean; message: string }>(`/saas/tenants/${id}/reset-password`, {
      newPassword,
    });
    return res.data;
  },

  deleteTenant: async (id: string): Promise<boolean> => {
    const res = await api.delete<{ success: boolean }>(`/saas/tenants/${id}`);
    return res.data.success;
  },

  createPlan: async (payload: Partial<SaaSPlan>): Promise<SaaSPlan> => {
    const res = await api.post<{ success: boolean; data: SaaSPlan }>("/saas/plans", payload);
    return res.data.data;
  },

  updatePlan: async (code: string, payload: Partial<SaaSPlan>): Promise<SaaSPlan> => {
    const res = await api.put<{ success: boolean; data: SaaSPlan }>(`/saas/plans/${code}`, payload);
    return res.data.data;
  },

  deletePlan: async (code: string): Promise<boolean> => {
    const res = await api.delete<{ success: boolean }>(`/saas/plans/${code}`);
    return res.data.success;
  },
};
