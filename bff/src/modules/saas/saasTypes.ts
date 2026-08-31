import { z } from "zod";

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

export const CreateTenantSchema = z.object({
  tenantName: z.string().min(2, "El nombre de la empresa es requerido"),
  tenantCode: z.string().min(2, "El código es requerido"),
  planCode: z.enum(["STARTER", "PYME_PRO", "ENTERPRISE"]).default("PYME_PRO"),
  taxId: z.string().min(3, "El RFC / TaxId es requerido"),
  adminName: z.string().min(2, "Nombre del administrador requerido"),
  adminUsername: z.string().min(3, "Usuario de acceso requerido"),
  adminEmail: z.string().email("Email inválido"),
  adminPassword: z.string().min(4, "La contraseña debe tener al menos 4 caracteres"),
  currency: z.string().default("MXN"),
});
export type CreateTenantPayload = z.infer<typeof CreateTenantSchema>;

export interface TenantCollaborator {
  id: number;
  tenantId: string;
  name: string;
  username: string;
  role: "CASHIER" | "ACCOUNTANT" | "WAREHOUSE" | "SALES" | "HR" | "TENANT_ADMIN";
  companyId: number;
  companyName: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
}

export const CreateCollaboratorSchema = z.object({
  name: z.string().min(2, "Nombre del colaborador requerido"),
  username: z.string().min(3, "Nombre de usuario requerido"),
  password: z.string().min(4, "Contraseña requerida"),
  email: z.string().email().optional(),
  role: z.enum(["CASHIER", "ACCOUNTANT", "WAREHOUSE", "SALES", "HR", "TENANT_ADMIN"]),
  companyId: z.number().int().positive(),
});
export type CreateCollaboratorPayload = z.infer<typeof CreateCollaboratorSchema>;
