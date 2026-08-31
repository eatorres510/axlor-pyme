import { z } from "zod";

export const CompanyOnboardSchema = z.object({
  name: z.string().min(2, "El nombre de la empresa debe tener al menos 2 caracteres"),
  code: z.string().min(2).max(20).optional(),
  taxId: z.string().min(3, "El RFC o Tax ID es requerido"),
  currencyCode: z.string().length(3).default("MXN"),
  adminEmail: z.string().email().optional(),
  adminPassword: z.string().min(6).optional(),
  adminFullName: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export type CompanyOnboardInput = z.infer<typeof CompanyOnboardSchema>;

export interface OnboardResult {
  success: boolean;
  company: {
    id: number;
    name: string;
    code: string;
    taxId: string;
    currency: string;
  };
  warehouse: {
    id: number;
    name: string;
    code: string;
  };
  accountsCreated: number;
  journalsCreated: number;
  sequencesCreated: number;
  defaultAccounts: {
    cashAccountId?: number;
    bankAccountId?: number;
    customerAccountId?: number;
    supplierAccountId?: number;
    salesAccountId?: number;
    costAccountId?: number;
    stockAccountId?: number;
    salaryAccountId?: number;
  };
  durationMs: number;
}
