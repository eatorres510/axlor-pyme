import { z } from "zod";

export const POSItemSchema = z.object({
  productId: z.number().min(1, "El ID de producto es requerido"),
  productName: z.string().min(1, "El nombre de producto es requerido"),
  barcode: z.string().optional(),
  qty: z.coerce.number().positive("La cantidad debe ser mayor a 0"),
  unitPrice: z.coerce.number().min(0, "El precio no puede ser negativo"),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
});

export type POSItemInput = z.infer<typeof POSItemSchema>;

export const POSPaymentSchema = z.object({
  method: z.enum(["CASH", "CARD", "TRANSFER"]),
  amountPaid: z.coerce.number().positive("El monto pagado debe ser mayor a 0"),
  cashRegisterId: z.number().optional(),
  bankAccountId: z.number().optional(),
  reference: z.string().optional(),
});

export type POSPaymentInput = z.infer<typeof POSPaymentSchema>;

export const POSCheckoutSchema = z.object({
  companyId: z.number().min(1, "El ID de empresa es requerido"),
  customerId: z.number().optional(),
  warehouseId: z.number().optional(),
  cashRegisterId: z.number().optional(),
  items: z.array(POSItemSchema).min(1, "Debe incluir al menos un producto en la venta"),
  payment: POSPaymentSchema,
  notes: z.string().optional(),
});

export type POSCheckoutInput = z.infer<typeof POSCheckoutSchema>;

export interface POSTicket {
  folio: string;
  timestamp: string;
  company: {
    id: number;
    name: string;
    taxId: string;
  };
  customer: {
    id?: number;
    name: string;
  };
  items: Array<{
    productId: number;
    name: string;
    qty: number;
    unitPrice: number;
    subtotal: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  payment: {
    method: "CASH" | "CARD" | "TRANSFER";
    amountPaid: number;
    change: number;
    reference?: string;
  };
  cashRegister?: {
    id?: number;
    name?: string;
  };
  saleOrderId: number;
  stockMoveId: number;
}
