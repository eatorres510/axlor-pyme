import { z } from "zod";

// --- Empleados ---
export const EmployeeSchema = z.object({
  name: z.string().min(2, "El nombre del empleado es requerido"),
  code: z.string().optional(),
  taxId: z.string().min(4, "El RFC / CURP / TaxID es requerido"),
  jobTitle: z.string().optional(),
  baseSalary: z.coerce.number().positive("El sueldo base debe ser mayor a 0"),
  paymentPeriod: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY"]).default("BIWEEKLY"),
  companyId: z.number().min(1, "El ID de empresa es requerido"),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

export type EmployeeInput = z.infer<typeof EmployeeSchema>;

// --- Anticipos ---
export const AdvanceSchema = z.object({
  employeeId: z.number().min(1, "El ID de empleado es requerido"),
  companyId: z.number().min(1, "El ID de empresa es requerido"),
  amount: z.coerce.number().positive("El importe del anticipo debe ser mayor a 0"),
  paymentMethod: z.enum(["CASH", "BANK"]).default("CASH"),
  date: z.string().optional(),
  notes: z.string().optional(),
});

export type AdvanceInput = z.infer<typeof AdvanceSchema>;

// --- Planilla / Dispersión de Nómina ---
export const PayrollItemSchema = z.object({
  employeeId: z.number().min(1, "El ID de empleado es requerido"),
  employeeName: z.string().min(1, "El nombre de empleado es requerido"),
  baseSalary: z.coerce.number().positive("El sueldo base debe ser mayor a 0"),
  bonus: z.coerce.number().min(0).default(0),
  deductions: z.coerce.number().min(0).default(0),
  advanceDeduction: z.coerce.number().min(0).default(0),
  netPaid: z.coerce.number().min(0),
});

export type PayrollItemInput = z.infer<typeof PayrollItemSchema>;

export const PayrollRunSchema = z.object({
  companyId: z.number().min(1, "El ID de empresa es requerido"),
  period: z.string().min(4, "El periodo de nómina es requerido (ej: 2026-08-Q2)"),
  periodType: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY"]).default("BIWEEKLY"),
  paymentMethod: z.enum(["CASH", "BANK"]).default("BANK"),
  items: z.array(PayrollItemSchema).min(1, "Debe incluir al menos un empleado en la corrida de nómina"),
  notes: z.string().optional(),
});

export type PayrollRunInput = z.infer<typeof PayrollRunSchema>;
