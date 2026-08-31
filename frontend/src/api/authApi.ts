import { apiClient } from "./client";

export interface AuthUser {
  userId: number;
  username: string;
  name: string;
  email?: string;
  role: "SUPER_ADMIN" | "TENANT_ADMIN" | "ADMIN" | "CASHIER" | "ACCOUNTANT" | "WAREHOUSE";
  tenantId?: string;
  planCode?: "STARTER" | "PYME_PRO" | "ENTERPRISE";
  activeCompanyId: number;
  activeCompanyName: string;
  allowedCompanies: Array<{
    id: number;
    name: string;
    code: string;
  }>;
  allowedCompanyIds: number[];
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export const authApi = {
  login: async (credentials: { username: string; password: string }): Promise<LoginResponse> => {
    const res = await apiClient.post<{ success: boolean; data: LoginResponse }>("/auth/login", credentials);
    return res.data.data;
  },

  getMe: async (): Promise<AuthUser> => {
    const res = await apiClient.get<{ success: boolean; data: AuthUser }>("/auth/me");
    return res.data.data;
  },

  switchCompany: async (companyId: number): Promise<LoginResponse> => {
    const res = await apiClient.post<{ success: boolean; data: LoginResponse }>("/auth/switch-company", {
      companyId,
    });
    return res.data.data;
  },
};
