import { z } from "zod";

export const LoginSchema = z.object({
  username: z.string().min(1, "El usuario o email es requerido"),
  password: z.string().min(1, "La contraseña es requerida"),
});
export type LoginPayload = z.infer<typeof LoginSchema>;

export const SwitchCompanySchema = z.object({
  companyId: z.number().int().positive("ID de empresa inválido"),
});
export type SwitchCompanyPayload = z.infer<typeof SwitchCompanySchema>;

export const RegisterUserSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(4),
  name: z.string().min(2),
  email: z.string().email().optional(),
  role: z.enum(["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN", "CASHIER", "ACCOUNTANT", "WAREHOUSE", "SALES", "HR"]).default("CASHIER"),
  companyId: z.number().int().positive(),
  allowedCompanyIds: z.array(z.number().int().positive()).optional(),
  tenantId: z.string().optional(),
});
export type RegisterUserPayload = z.infer<typeof RegisterUserSchema>;

export interface AuthUserToken {
  userId: number;
  username: string;
  name: string;
  email?: string;
  role: "SUPER_ADMIN" | "TENANT_ADMIN" | "ADMIN" | "CASHIER" | "ACCOUNTANT" | "WAREHOUSE" | "SALES" | "HR";
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
