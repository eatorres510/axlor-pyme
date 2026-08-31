import { z } from "zod";

export const ExpenseCategoryEnum = z.enum([
  "RENT",
  "UTILITIES",
  "MARKETING",
  "MAINTENANCE",
  "SOFTWARE",
  "LOGISTICS",
  "OTHER",
]);

export type ExpenseCategory = z.infer<typeof ExpenseCategoryEnum>;

export const ExpenseSchema = z.object({
  companyId: z.number().min(1, "El ID de empresa es requerido"),
  category: ExpenseCategoryEnum,
  description: z.string().min(3, "La descripción del gasto es requerida"),
  amount: z.coerce.number().positive("El importe del gasto debe ser mayor a 0"),
  taxAmount: z.coerce.number().min(0).default(0),
  paymentMethod: z.enum(["CASH", "BANK"]).default("CASH"),
  supplierId: z.number().optional(),
  creditorName: z.string().optional(),
  supplierName: z.string().optional(),
  journalId: z.number().optional(),
  expenseDate: z.string().optional(),
  receiptNumber: z.string().optional(),
  notes: z.string().optional(),
});

export type ExpenseInput = z.infer<typeof ExpenseSchema>;
