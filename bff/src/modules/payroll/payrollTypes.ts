import { z } from "zod";

// --- Empleados ---
export const EmployeeSchema = z.object({
  name: z.string().min(2, "El nombre del empleado es requerido"),
  code: z.string().optional(),
  taxId: z.string().min(4, "El RFC / CURP / TaxID es requerido"),
  jobTitle: z.string().optional(),
  department: z.string().optional().default("General"),
  baseSalary: z.coerce.number().positive("El sueldo base debe ser mayor a 0"),
  paymentPeriod: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY"]).default("BIWEEKLY"),
  companyId: z.number().min(1, "El ID de empresa es requerido"),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  clabe: z.string().optional(),
  hireDate: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export type EmployeeInput = z.infer<typeof EmployeeSchema>;

export const UpdateEmployeeSchema = EmployeeSchema.partial();
export type UpdateEmployeeInput = z.infer<typeof UpdateEmployeeSchema>;

// --- Periodos de Nómina ---
export const PayrollPeriodSchema = z.object({
  companyId: z.number().min(1, "El ID de empresa es requerido"),
  code: z.string().min(3, "El código de periodo es requerido (ej: 2026-09-Q1)"),
  name: z.string().min(3, "El nombre del periodo es requerido"),
  periodType: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY"]).default("BIWEEKLY"),
  startDate: z.string().min(10, "La fecha de inicio es requerida"),
  endDate: z.string().min(10, "La fecha de fin es requerida"),
  paymentDate: z.string().min(10, "La fecha de pago es requerida"),
  status: z.enum(["OPEN", "PROCESSING", "PAID", "CLOSED"]).default("OPEN"),
  notes: z.string().optional(),
});

export type PayrollPeriodInput = z.infer<typeof PayrollPeriodSchema>;

export const UpdatePayrollPeriodSchema = PayrollPeriodSchema.partial();
export type UpdatePayrollPeriodInput = z.infer<typeof UpdatePayrollPeriodSchema>;

// --- Anticipos y Préstamos de Sueldo ---
export const AdvanceSchema = z.object({
  employeeId: z.number().min(1, "El ID de empleado es requerido"),
  companyId: z.number().min(1, "El ID de empresa es requerido"),
  periodCode: z.string().optional(),
  amount: z.coerce.number().positive("El importe del anticipo debe ser mayor a 0"),
  paymentMethod: z.enum(["CASH", "BANK"]).default("CASH"),
  date: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["PENDING", "AUTHORIZED", "DEDUCTED", "REJECTED"]).default("PENDING"),
});

export type AdvanceInput = z.infer<typeof AdvanceSchema>;

export const UpdateAdvanceSchema = z.object({
  amount: z.coerce.number().positive("El importe del anticipo debe ser mayor a 0").optional(),
  paymentMethod: z.enum(["CASH", "BANK"]).optional(),
  date: z.string().optional(),
  notes: z.string().optional(),
  periodCode: z.string().optional(),
});

export type UpdateAdvanceInput = z.infer<typeof UpdateAdvanceSchema>;

export const AuthorizeAdvanceSchema = z.object({
  companyId: z.number().min(1),
  paymentMethod: z.enum(["CASH", "BANK"]).default("CASH"),
  authorizedBy: z.string().optional().default("Administrador"),
});

export type AuthorizeAdvanceInput = z.infer<typeof AuthorizeAdvanceSchema>;

// --- Planilla / Dispersión de Nómina ---
export const PayrollItemSchema = z.object({
  employeeId: z.number().min(1, "El ID de empleado es requerido"),
  employeeName: z.string().min(1, "El nombre de empleado es requerido"),
  baseSalary: z.coerce.number().positive("El sueldo base debe ser mayor a 0"),
  bonus: z.coerce.number().min(0).default(0).optional(),
  overtime: z.coerce.number().min(0).default(0).optional(),
  deductions: z.coerce.number().min(0).default(0).optional(),
  taxDeduction: z.coerce.number().min(0).default(0).optional(),
  imssDeduction: z.coerce.number().min(0).default(0).optional(),
  otherDeductions: z.coerce.number().min(0).default(0).optional(),
  advanceDeduction: z.coerce.number().min(0).default(0).optional(),
  advanceIds: z.array(z.number()).default([]).optional(),
  netPaid: z.coerce.number().min(0),
  notes: z.string().optional(),
});

export type PayrollItemInput = z.infer<typeof PayrollItemSchema>;

export const PayrollRunSchema = z.object({
  companyId: z.number().min(1, "El ID de empresa es requerido"),
  period: z.string().min(4, "El periodo de nómina es requerido (ej: 2026-09-Q1)"),
  periodType: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY"]).default("BIWEEKLY"),
  paymentMethod: z.enum(["CASH", "BANK"]).default("BANK"),
  items: z.array(PayrollItemSchema).min(1, "Debe incluir al menos un empleado en la corrida de nómina"),
  notes: z.string().optional(),
});

export type PayrollRunInput = z.infer<typeof PayrollRunSchema>;

