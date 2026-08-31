import { api } from "./client";

export interface TenantCollaborator {
  id: number;
  tenantId: string;
  name: string;
  username: string;
  role: "CASHIER" | "ACCOUNTANT" | "WAREHOUSE" | "SALES" | "HR" | "TENANT_ADMIN";
  companyId: number;
  companyName: string;
  status?: "ACTIVE" | "INACTIVE";
  createdAt: string;
}

export interface PlanUsageResponse {
  tenant: any;
  plan: any;
  usage: {
    companiesUsed: number;
    companiesMax: number;
    usersUsed: number;
    usersMax: number;
  };
}

export interface LATAMCompanySettings {
  companyId: number;
  country: string;
  name: string;
  commercialName?: string;
  code: string;
  taxId: string;
  taxIdType?: string;
  giro?: string;
  regimenFiscal: string;
  patronalNumber?: string;
  repName?: string;
  repDoc?: string;
  address: string;
  neighborhood?: string;
  postalCode: string;
  city: string;
  state: string;
  phone: string;
  whatsapp?: string;
  email: string;
  website?: string;
  resolutionNumber?: string;
  resolutionPrefix?: string;
  resolutionRangeFrom?: string;
  resolutionRangeTo?: string;
  resolutionExpiry?: string;
  defaultTaxRate?: number;
  currency: string;
  secondaryCurrency?: string;
  exchangeRate?: number;
  enableDualCurrency?: boolean;
  exchangeRateUpdated?: string;
  logoUrl?: string;
  ticketHeader?: string;
  ticketFooter?: string;
}

export const tenantApi = {
  listCollaborators: async (): Promise<TenantCollaborator[]> => {
    const res = await api.get<{ success: boolean; data: TenantCollaborator[] }>("/tenant/collaborators");
    return res.data.data;
  },

  createCollaborator: async (payload: {
    name: string;
    username: string;
    password: string;
    role: "CASHIER" | "ACCOUNTANT" | "WAREHOUSE" | "SALES" | "HR" | "TENANT_ADMIN";
    companyId: number;
    email?: string;
  }): Promise<TenantCollaborator> => {
    const res = await api.post<{ success: boolean; data: TenantCollaborator }>("/tenant/collaborators", payload);
    return res.data.data;
  },

  toggleCollaboratorStatus: async (id: number): Promise<TenantCollaborator> => {
    const res = await api.put<{ success: boolean; data: TenantCollaborator }>(`/tenant/collaborators/${id}/status`);
    return res.data.data;
  },

  updateCollaborator: async (
    id: number,
    payload: { name?: string; role?: any; companyId?: number; companyName?: string }
  ): Promise<TenantCollaborator> => {
    const res = await api.put<{ success: boolean; data: TenantCollaborator }>(`/tenant/collaborators/${id}`, payload);
    return res.data.data;
  },

  deleteCollaborator: async (id: number): Promise<void> => {
    await api.delete(`/tenant/collaborators/${id}`);
  },

  createBranch: async (payload: {
    name: string;
    code: string;
    taxId?: string;
    currency?: string;
  }) => {
    const res = await api.post<{ success: boolean; data: any }>("/tenant/branches", payload);
    return res.data.data;
  },

  getPlanUsage: async (): Promise<PlanUsageResponse> => {
    const res = await api.get<{ success: boolean; data: PlanUsageResponse }>("/tenant/plan");
    return res.data.data;
  },

  getCompanySettings: async (companyId?: number): Promise<LATAMCompanySettings> => {
    const res = await api.get<{ success: boolean; data: LATAMCompanySettings }>("/tenant/company-settings", {
      params: { companyId },
    });
    return res.data.data;
  },

  updateCompanySettings: async (payload: Partial<LATAMCompanySettings>) => {
    const res = await api.put<{ success: boolean; data: LATAMCompanySettings }>("/tenant/company-settings", payload);
    return res.data.data;
  },
};
