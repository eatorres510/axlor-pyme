import { api } from "./client";

export interface CompanyDTO {
  id: number;
  name: string;
  code: string;
  taxId?: string;
  currency?: string;
}

export const companyApi = {
  listCompanies: async (): Promise<CompanyDTO[]> => {
    try {
      const res = await api.get<{ success: boolean; data: CompanyDTO[] }>("/onboarding/companies");
      return res.data?.data || [];
    } catch {
      return [
        { id: 13, name: "Distribuidora Nacional PyME S.A.", code: "DISTR857" },
        { id: 14, name: "Ferretería El Roble S.A.", code: "ROBLE101" },
      ];
    }
  },
};
